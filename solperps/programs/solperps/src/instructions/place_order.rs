use anchor_lang::prelude::*;
use crate::error::SolPerpsError;
use crate::events::TradeEvent;
use crate::math::{
    calculate_fee, notional, opposite_side, price_crosses, required_initial_margin,
};
use crate::state::{
    Exchange, Market, Order, OrderType, Position, Side, TraderAccount, MAX_LEVERAGE,
};

const MAKER_ACCOUNTS_LEN: usize = 3;

#[derive(Accounts)]
#[instruction(side: Side, order_type: OrderType, price: u64, size: u64, leverage: u8, order_id: u64)]
pub struct PlaceOrder<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,

    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"exchange"],
        bump = exchange.bump,
    )]
    pub exchange: Account<'info, Exchange>,

    #[account(
        mut,
        seeds = [b"trader", taker.key().as_ref()],
        bump = taker_account.bump,
        constraint = taker_account.owner == taker.key() @ SolPerpsError::Unauthorized,
    )]
    pub taker_account: Account<'info, TraderAccount>,

    #[account(
        init_if_needed,
        payer = taker,
        space = 8 + Position::INIT_SPACE,
        seeds = [
            b"position",
            taker.key().as_ref(),
            market.key().as_ref(),
            &[side as u8],
        ],
        bump
    )]
    pub taker_position: Account<'info, Position>,

    #[account(
        init,
        payer = taker,
        space = 8 + Order::INIT_SPACE,
        seeds = [b"order", market.key().as_ref(), &order_id.to_le_bytes()],
        bump
    )]
    pub resting_order: Account<'info, Order>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<PlaceOrder>,
    side: Side,
    order_type: OrderType,
    price: u64,
    size: u64,
    leverage: u8,
    order_id: u64,
) -> Result<()> {
    require!(size > 0, SolPerpsError::InvalidOrderSize);
    require!(
        leverage > 0 && leverage <= MAX_LEVERAGE,
        SolPerpsError::InvalidLeverage
    );

    let market_key = ctx.accounts.market.key();
    let fee_bps = ctx.accounts.market.fee_bps;
    let insurance_fund_cut_bps = ctx.accounts.market.insurance_fund_cut_bps;
    let mark_price = ctx.accounts.market.mark_price;
    let index_price = ctx.accounts.market.index_price;

    let effective_price = match order_type {
        OrderType::Market => match side {
            Side::Long => mark_price.max(index_price),
            Side::Short => {
                if mark_price > 0 {
                    mark_price
                } else {
                    index_price
                }
            }
        },
        OrderType::Limit => {
            require!(price > 0, SolPerpsError::InvalidPrice);
            price
        }
    };
    require!(effective_price > 0, SolPerpsError::InvalidPrice);

    let order_notional = notional(size, effective_price)?;
    let margin_required = required_initial_margin(order_notional, leverage)?;

    {
        let taker = &ctx.accounts.taker_account;
        let free = taker.collateral.saturating_sub(taker.locked_margin);
        require!(free >= margin_required, SolPerpsError::InsufficientMargin);
    }

    {
        let taker = &mut ctx.accounts.taker_account;
        taker.locked_margin = taker
            .locked_margin
            .checked_add(margin_required)
            .ok_or(SolPerpsError::MathOverflow)?;
    }

    if ctx.accounts.taker_position.size == 0 {
        let pos = &mut ctx.accounts.taker_position;
        pos.trader = ctx.accounts.taker.key();
        pos.market = market_key;
        pos.side = side;
        pos.bump = ctx.bumps.taker_position;
    }

    let mut remaining_size = size;
    let mut margin_used = 0u64;

    let len = ctx.remaining_accounts.len();
    require!(
        len % MAKER_ACCOUNTS_LEN == 0,
        SolPerpsError::InvalidMakerOrder
    );

    let mut idx = 0usize;
    while idx < len {
        if remaining_size == 0 {
            break;
        }

        let fill = match_maker(
            ctx.remaining_accounts[idx].clone(),
            ctx.remaining_accounts[idx + 1].clone(),
            ctx.remaining_accounts[idx + 2].clone(),
            market_key,
            side,
            price,
            order_type,
            remaining_size,
            leverage,
            fee_bps,
        )?;

        apply_fill(
            &mut ctx.accounts.taker_account,
            &mut ctx.accounts.taker_position,
            ctx.accounts.taker.key(),
            market_key,
            side,
            fill.fill_price,
            fill.fill_size,
            fill.fill_margin,
        )?;

        let taker = &mut ctx.accounts.taker_account;
        taker.collateral = taker
            .collateral
            .checked_sub(fill.fee)
            .ok_or(SolPerpsError::MathOverflow)?;

        let insurance_cut = (fill.fee as u128)
            .checked_mul(insurance_fund_cut_bps as u128)
            .ok_or(SolPerpsError::MathOverflow)?
            .checked_div(10_000)
            .ok_or(SolPerpsError::MathOverflow)? as u64;

        let exchange = &mut ctx.accounts.exchange;
        exchange.insurance_balance = exchange
            .insurance_balance
            .checked_add(insurance_cut)
            .ok_or(SolPerpsError::MathOverflow)?;
        exchange.total_collected = exchange
            .total_collected
            .checked_add(insurance_cut)
            .ok_or(SolPerpsError::MathOverflow)?;

        remaining_size = remaining_size
            .checked_sub(fill.fill_size)
            .ok_or(SolPerpsError::MathOverflow)?;
        margin_used = margin_used
            .checked_add(fill.fill_margin)
            .ok_or(SolPerpsError::MathOverflow)?;

        let market = &mut ctx.accounts.market;
        market.open_interest = market
            .open_interest
            .checked_add(fill.fill_size)
            .ok_or(SolPerpsError::MathOverflow)?;

        emit!(TradeEvent {
            market: market.key(),
            maker: fill.maker,
            taker: ctx.accounts.taker.key(),
            price: fill.fill_price,
            size: fill.fill_size,
            fee: fill.fee,
            side,
        });

        idx += MAKER_ACCOUNTS_LEN;
    }

    if order_type == OrderType::Market && remaining_size > 0 {
        return err!(SolPerpsError::InsufficientLiquidity);
    }

    if order_type == OrderType::Limit && remaining_size > 0 {
        let next_id = ctx.accounts.market.next_order_id;
        require!(order_id == next_id, SolPerpsError::InvalidMakerOrder);

        let resting = &mut ctx.accounts.resting_order;
        resting.market = market_key;
        resting.trader = ctx.accounts.taker.key();
        resting.order_id = next_id;
        resting.side = side;
        resting.order_type = order_type;
        resting.price = price;
        resting.size = remaining_size;
        resting.leverage = leverage;
        resting.timestamp = Clock::get()?.unix_timestamp;
        resting.bump = ctx.bumps.resting_order;

        ctx.accounts.market.next_order_id = ctx
            .accounts
            .market
            .next_order_id
            .checked_add(1)
            .ok_or(SolPerpsError::MathOverflow)?;
    } else {
        let resting = &mut ctx.accounts.resting_order;
        resting.size = 0;
    }

    let taker = &mut ctx.accounts.taker_account;
    let unused_margin = margin_required.saturating_sub(margin_used);
    if remaining_size == 0 || order_type == OrderType::Market {
        taker.locked_margin = taker.locked_margin.saturating_sub(unused_margin);
    }

    Ok(())
}

struct MakerFill {
    fill_size: u64,
    fill_price: u64,
    fill_margin: u64,
    fee: u64,
    maker: Pubkey,
}

fn match_maker(
    maker_order_info: AccountInfo,
    maker_trader_info: AccountInfo,
    maker_position_info: AccountInfo,
    market_key: Pubkey,
    side: Side,
    price: u64,
    order_type: OrderType,
    remaining_size: u64,
    leverage: u8,
    fee_bps: u16,
) -> Result<MakerFill> {
    let mut maker_order = load_account::<Order>(&maker_order_info)?;
    let mut maker_trader = load_account::<TraderAccount>(&maker_trader_info)?;
    let mut maker_position = load_account::<Position>(&maker_position_info)?;

    require!(
        maker_order.market == market_key,
        SolPerpsError::InvalidMakerOrder
    );
    require!(maker_order.size > 0, SolPerpsError::InvalidMakerOrder);
    require!(
        maker_order.side == opposite_side(side),
        SolPerpsError::InvalidMakerOrder
    );
    require!(
        price_crosses(side, price, maker_order.price, order_type),
        SolPerpsError::InvalidMakerOrder
    );

    let fill_size = remaining_size.min(maker_order.size);
    let fill_price = maker_order.price;
    let fee = calculate_fee(fill_size, fill_price, fee_bps)?;
    let fill_notional = notional(fill_size, fill_price)?;
    let fill_margin = required_initial_margin(fill_notional, leverage)?;

    apply_fill(
        &mut maker_trader,
        &mut maker_position,
        maker_order.trader,
        market_key,
        opposite_side(side),
        fill_price,
        fill_size,
        fill_margin,
    )?;

    let maker = maker_order.trader;

    maker_order.size = maker_order
        .size
        .checked_sub(fill_size)
        .ok_or(SolPerpsError::MathOverflow)?;
    save_account(&maker_order_info, &maker_order)?;
    save_account(&maker_trader_info, &maker_trader)?;
    save_account(&maker_position_info, &maker_position)?;

    Ok(MakerFill {
        fill_size,
        fill_price,
        fill_margin,
        fee,
        maker,
    })
}

fn apply_fill(
    trader: &mut TraderAccount,
    position: &mut Position,
    trader_key: Pubkey,
    market_key: Pubkey,
    side: Side,
    fill_price: u64,
    fill_size: u64,
    fill_margin: u64,
) -> Result<()> {
    if position.size == 0 {
        position.trader = trader_key;
        position.market = market_key;
        position.side = side;
        position.entry_price = fill_price;
        position.size = fill_size;
        position.margin_allocated = fill_margin;
        position.unrealized_pnl = 0;
    } else {
        let total_size = position
            .size
            .checked_add(fill_size)
            .ok_or(SolPerpsError::MathOverflow)?;
        let weighted = (position.entry_price as u128)
            .checked_mul(position.size as u128)
            .ok_or(SolPerpsError::MathOverflow)?
            .checked_add(
                (fill_price as u128)
                    .checked_mul(fill_size as u128)
                    .ok_or(SolPerpsError::MathOverflow)?,
            )
            .ok_or(SolPerpsError::MathOverflow)?
            .checked_div(total_size as u128)
            .ok_or(SolPerpsError::MathOverflow)?;

        position.entry_price = u64::try_from(weighted).map_err(|_| SolPerpsError::MathOverflow)?;
        position.size = total_size;
        position.margin_allocated = position
            .margin_allocated
            .checked_add(fill_margin)
            .ok_or(SolPerpsError::MathOverflow)?;
    }

    trader.locked_margin = trader
        .locked_margin
        .saturating_sub(fill_margin);

    Ok(())
}

fn load_account<T: AccountSerialize + AccountDeserialize + Owner>(info: &AccountInfo) -> Result<T> {
    require!(info.owner == &T::owner(), SolPerpsError::Unauthorized);
    let data = info.try_borrow_mut_data()?;
    T::try_deserialize(&mut &data[..]).map_err(Into::into)
}

fn save_account<T: AccountSerialize>(info: &AccountInfo, account: &T) -> Result<()> {
    let mut data = info.try_borrow_mut_data()?;
    account.try_serialize(&mut &mut data[..]).map_err(Into::into)
}

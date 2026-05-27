use anchor_lang::prelude::*;
use crate::error::SolPerpsError;
use crate::events::PositionLiquidated;
use crate::math::{calculate_unrealized_pnl, is_liquidatable, notional, required_maintenance_margin};
use crate::state::{Exchange, Market, Position, TraderAccount};

#[derive(Accounts)]
pub struct LiquidatePosition<'info> {
    pub liquidator: Signer<'info>,

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
        seeds = [b"trader", trader_account.owner.as_ref()],
        bump = trader_account.bump,
    )]
    pub trader_account: Account<'info, TraderAccount>,

    #[account(
        mut,
        seeds = [
            b"position",
            trader_account.owner.as_ref(),
            market.key().as_ref(),
            &[position.side as u8],
        ],
        bump = position.bump,
        has_one = market @ SolPerpsError::PositionNotFound,
    )]
    pub position: Account<'info, Position>,
}

pub fn handler(ctx: Context<LiquidatePosition>) -> Result<()> {
    let position = &ctx.accounts.position;
    require!(position.size > 0, SolPerpsError::PositionNotFound);

    let mark_price = ctx.accounts.market.mark_price;
    let pos_notional = notional(position.size, mark_price)?;
    let pnl = calculate_unrealized_pnl(
        position.side,
        position.size,
        position.entry_price,
        mark_price,
    )?;

    let trader = &ctx.accounts.trader_account;
    require!(
        is_liquidatable(trader.collateral, pnl, pos_notional)?,
        SolPerpsError::NotLiquidatable
    );

    let maint_margin = required_maintenance_margin(pos_notional)?;
    let penalty = maint_margin / 2;

    let trader = &mut ctx.accounts.trader_account;
    if pnl < 0 {
        trader.collateral = trader
            .collateral
            .saturating_sub(pnl.unsigned_abs());
    } else {
        trader.collateral = trader
            .collateral
            .checked_add(pnl as u64)
            .ok_or(SolPerpsError::MathOverflow)?;
    }

    trader.collateral = trader.collateral.saturating_sub(penalty);
    trader.locked_margin = trader
        .locked_margin
        .saturating_sub(position.margin_allocated);

    trader.collateral = trader
        .collateral
        .checked_add(position.margin_allocated)
        .ok_or(SolPerpsError::MathOverflow)?;

    let exchange = &mut ctx.accounts.exchange;
    exchange.insurance_balance = exchange
        .insurance_balance
        .checked_add(penalty)
        .ok_or(SolPerpsError::MathOverflow)?;
    exchange.total_collected = exchange
        .total_collected
        .checked_add(penalty)
        .ok_or(SolPerpsError::MathOverflow)?;

    let closed_size = ctx.accounts.position.size;
    let closed_side = ctx.accounts.position.side;

    let position = &mut ctx.accounts.position;
    position.size = 0;
    position.margin_allocated = 0;
    position.unrealized_pnl = 0;

    let market = &mut ctx.accounts.market;
    market.open_interest = market.open_interest.saturating_sub(closed_size);

    emit!(PositionLiquidated {
        trader: ctx.accounts.trader_account.owner,
        market: market.key(),
        side: closed_side,
        penalty,
    });

    Ok(())
}

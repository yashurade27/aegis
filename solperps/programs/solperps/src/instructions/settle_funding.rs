use anchor_lang::prelude::*;
use crate::error::SolPerpsError;
use crate::events::FundingSettled;
use crate::math::{apply_funding, compute_funding_rate};
use crate::state::{Market, Position, TraderAccount};

const FUNDING_ACCOUNTS_LEN: usize = 2;

#[derive(Accounts)]
pub struct SettleFunding<'info> {
    pub keeper: Signer<'info>,

    #[account(mut)]
    pub market: Account<'info, Market>,
}

pub fn handler(ctx: Context<SettleFunding>) -> Result<()> {
    let market_key = ctx.accounts.market.key();
    let funding_rate =
        compute_funding_rate(ctx.accounts.market.mark_price, ctx.accounts.market.index_price)?;
    let now = Clock::get()?.unix_timestamp;

    let len = ctx.remaining_accounts.len();
    require!(
        len % FUNDING_ACCOUNTS_LEN == 0,
        SolPerpsError::InvalidMakerOrder
    );

    let mut idx = 0usize;
    while idx < len {
        apply_funding_to_pair(
            ctx.remaining_accounts[idx].clone(),
            ctx.remaining_accounts[idx + 1].clone(),
            market_key,
            funding_rate,
        )?;
        idx += FUNDING_ACCOUNTS_LEN;
    }

    let market = &mut ctx.accounts.market;
    market.last_funding_ts = now;

    emit!(FundingSettled {
        market: market.key(),
        funding_rate_bps: funding_rate,
        timestamp: now,
    });

    Ok(())
}

fn apply_funding_to_pair(
    trader_info: AccountInfo,
    position_info: AccountInfo,
    market_key: Pubkey,
    funding_rate: i64,
) -> Result<()> {
    let mut trader = load_account::<TraderAccount>(&trader_info)?;
    let mut position = load_account::<Position>(&position_info)?;

    require!(position.market == market_key, SolPerpsError::PositionNotFound);
    require!(position.size > 0, SolPerpsError::PositionNotFound);

    let payment = apply_funding(
        position.side,
        position.size,
        position.entry_price,
        funding_rate,
    )?;

    position.unrealized_pnl = position
        .unrealized_pnl
        .checked_add(payment)
        .ok_or(SolPerpsError::MathOverflow)?;

    if payment < 0 {
        trader.collateral = trader
            .collateral
            .checked_sub(payment.unsigned_abs())
            .ok_or(SolPerpsError::MathOverflow)?;
    } else {
        trader.collateral = trader
            .collateral
            .checked_add(payment as u64)
            .ok_or(SolPerpsError::MathOverflow)?;
    }

    save_account(&trader_info, &trader)?;
    save_account(&position_info, &position)?;
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

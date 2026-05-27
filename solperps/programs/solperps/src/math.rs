use anchor_lang::prelude::*;
use crate::error::SolPerpsError;
use crate::state::{
    Side, BPS_DENOMINATOR, DEFAULT_MAINTENANCE_MARGIN_BPS, MAX_FUNDING_RATE_BPS, PRICE_SCALE,
};

pub fn notional(size: u64, price: u64) -> Result<u64> {
    let value = (size as u128)
        .checked_mul(price as u128)
        .ok_or(SolPerpsError::MathOverflow)?
        .checked_div(PRICE_SCALE as u128)
        .ok_or(SolPerpsError::MathOverflow)?;
    u64::try_from(value).map_err(|_| SolPerpsError::MathOverflow.into())
}

pub fn required_initial_margin(notional: u64, leverage: u8) -> Result<u64> {
    require!(leverage > 0, SolPerpsError::InvalidLeverage);
    notional
        .checked_div(leverage as u64)
        .ok_or(SolPerpsError::MathOverflow.into())
}

pub fn required_maintenance_margin(notional: u64) -> Result<u64> {
    let value = (notional as u128)
        .checked_mul(DEFAULT_MAINTENANCE_MARGIN_BPS as u128)
        .ok_or(SolPerpsError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR as u128)
        .ok_or(SolPerpsError::MathOverflow)?;
    u64::try_from(value).map_err(|_| SolPerpsError::MathOverflow.into())
}

pub fn calculate_fee(size: u64, price: u64, fee_bps: u16) -> Result<u64> {
    let base_notional = notional(size, price)?;
    let value = (base_notional as u128)
        .checked_mul(fee_bps as u128)
        .ok_or(SolPerpsError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR as u128)
        .ok_or(SolPerpsError::MathOverflow)?;
    u64::try_from(value).map_err(|_| SolPerpsError::MathOverflow.into())
}

pub fn margin_health(collateral: u64, unrealized_pnl: i64, notional: u64) -> Result<u64> {
    if notional == 0 {
        return Ok(BPS_DENOMINATOR);
    }
    let equity = if unrealized_pnl >= 0 {
        collateral
            .checked_add(unrealized_pnl as u64)
            .ok_or(SolPerpsError::MathOverflow)?
    } else {
        collateral
            .checked_sub(unrealized_pnl.unsigned_abs())
            .ok_or(SolPerpsError::MathOverflow)?
    };

    let value = (equity as u128)
        .checked_mul(BPS_DENOMINATOR as u128)
        .ok_or(SolPerpsError::MathOverflow)?
        .checked_div(notional as u128)
        .ok_or(SolPerpsError::MathOverflow)?;
    u64::try_from(value).map_err(|_| SolPerpsError::MathOverflow.into())
}

pub fn liquidation_price(entry_price: u64, side: Side, leverage: u8) -> Result<u64> {
    require!(leverage > 0, SolPerpsError::InvalidLeverage);
    let bps = BPS_DENOMINATOR;
    let lev_bps = bps / leverage as u64;
    let numerator = match side {
        Side::Long => bps
            .checked_sub(lev_bps)
            .and_then(|v| v.checked_add(DEFAULT_MAINTENANCE_MARGIN_BPS))
            .ok_or(SolPerpsError::MathOverflow)?,
        Side::Short => bps
            .checked_add(lev_bps)
            .and_then(|v| v.checked_sub(DEFAULT_MAINTENANCE_MARGIN_BPS))
            .ok_or(SolPerpsError::MathOverflow)?,
    };

    let value = (entry_price as u128)
        .checked_mul(numerator as u128)
        .ok_or(SolPerpsError::MathOverflow)?
        .checked_div(bps as u128)
        .ok_or(SolPerpsError::MathOverflow)?;
    u64::try_from(value).map_err(|_| SolPerpsError::MathOverflow.into())
}

pub fn compute_funding_rate(mark_price: u64, index_price: u64) -> Result<i64> {
    require!(index_price > 0, SolPerpsError::InvalidPrice);
    let diff = mark_price as i128 - index_price as i128;
    let raw = diff
        .checked_mul(BPS_DENOMINATOR as i128)
        .ok_or(SolPerpsError::MathOverflow)?
        .checked_div(index_price as i128)
        .ok_or(SolPerpsError::MathOverflow)?;

    let clamped = raw.clamp(-(MAX_FUNDING_RATE_BPS as i128), MAX_FUNDING_RATE_BPS as i128);
    i64::try_from(clamped).map_err(|_| SolPerpsError::MathOverflow.into())
}

pub fn calculate_unrealized_pnl(
    side: Side,
    size: u64,
    entry_price: u64,
    mark_price: u64,
) -> Result<i64> {
    let size_notional = notional(size, mark_price)?;
    let entry_notional = notional(size, entry_price)?;
    match side {
        Side::Long => i64::try_from(size_notional)
            .map_err(|_| SolPerpsError::MathOverflow)?
            .checked_sub(entry_notional as i64)
            .ok_or(SolPerpsError::MathOverflow.into()),
        Side::Short => i64::try_from(entry_notional)
            .map_err(|_| SolPerpsError::MathOverflow)?
            .checked_sub(size_notional as i64)
            .ok_or(SolPerpsError::MathOverflow.into()),
    }
}

pub fn apply_funding(side: Side, size: u64, entry_price: u64, funding_rate_bps: i64) -> Result<i64> {
    let position_notional = notional(size, entry_price)?;
    let payment = (position_notional as i128)
        .checked_mul(funding_rate_bps as i128)
        .ok_or(SolPerpsError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR as i128)
        .ok_or(SolPerpsError::MathOverflow)?;

    let payment_i64 = i64::try_from(payment).map_err(|_| SolPerpsError::MathOverflow)?;
    match side {
        Side::Long => Ok(-payment_i64),
        Side::Short => Ok(payment_i64),
    }
}

pub fn is_liquidatable(
    collateral: u64,
    unrealized_pnl: i64,
    position_notional: u64,
) -> Result<bool> {
    let health = margin_health(collateral, unrealized_pnl, position_notional)?;
    Ok(health < DEFAULT_MAINTENANCE_MARGIN_BPS)
}

pub fn can_withdraw(
    collateral: u64,
    withdraw_amount: u64,
    locked_margin: u64,
    unrealized_pnl: i64,
    position_notional: u64,
) -> Result<bool> {
    if withdraw_amount > collateral {
        return Ok(false);
    }
    let remaining = collateral
        .checked_sub(withdraw_amount)
        .ok_or(SolPerpsError::MathOverflow)?;
    let free_collateral = remaining.saturating_sub(locked_margin);
    if position_notional == 0 {
        return Ok(true);
    }
    let health = margin_health(free_collateral, unrealized_pnl, position_notional)?;
    Ok(health >= DEFAULT_MAINTENANCE_MARGIN_BPS)
}

pub fn price_crosses(
    side: Side,
    taker_price: u64,
    maker_price: u64,
    order_type: crate::state::OrderType,
) -> bool {
    use crate::state::OrderType;
    match order_type {
        OrderType::Market => true,
        OrderType::Limit => match side {
            Side::Long => taker_price >= maker_price,
            Side::Short => taker_price <= maker_price,
        },
    }
}

pub fn opposite_side(side: Side) -> Side {
    match side {
        Side::Long => Side::Short,
        Side::Short => Side::Long,
    }
}

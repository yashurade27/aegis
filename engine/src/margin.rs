use std::collections::HashMap;
use crate::pnl::calculate_unrealized_pnl;
use crate::types::{Side, TraderAccount, BPS_DENOMINATOR, DEFAULT_MAINTENANCE_MARGIN_BPS};

pub fn required_initial_margin(notional: f64, leverage: f64) -> Result<f64, &'static str> {
    if leverage <= 0.0 {
        return Err("Leverage must be positive");
    }
    Ok(notional / leverage)
}

pub fn required_maintenance_margin(notional: f64, maintenance_margin_bps: Option<f64>) -> f64 {
    let maint = maintenance_margin_bps.unwrap_or(DEFAULT_MAINTENANCE_MARGIN_BPS);
    (notional * maint) / BPS_DENOMINATOR
}

pub fn margin_health(collateral: f64, unrealized_pnl: f64, notional: f64) -> f64 {
    if notional == 0.0 {
        return BPS_DENOMINATOR;
    }
    ((collateral + unrealized_pnl) / notional) * BPS_DENOMINATOR
}

pub fn liquidation_price(
    entry_price: f64,
    side: Side,
    maintenance_margin_bps: Option<f64>,
    leverage: Option<f64>,
) -> Result<f64, &'static str> {
    let lev = leverage.unwrap_or(1.0);
    if lev <= 0.0 {
        return Err("Leverage must be positive");
    }

    let maint = maintenance_margin_bps.unwrap_or(DEFAULT_MAINTENANCE_MARGIN_BPS);
    let margin_fraction = 1.0 / lev;
    let maint_fraction = maint / BPS_DENOMINATOR;

    match side {
        Side::Long => Ok(entry_price * (1.0 - margin_fraction + maint_fraction)),
        Side::Short => Ok(entry_price * (1.0 + margin_fraction - maint_fraction)),
    }
}

pub fn can_withdraw(account: &TraderAccount, amount: f64, mark_prices: &HashMap<String, f64>) -> bool {
    if amount > account.collateral_balance {
        return false;
    }

    let remaining_collateral = account.collateral_balance - amount;
    let mut total_margin_required = 0.0;

    for pos in &account.positions {
        let mark_price = *mark_prices.get(&pos.market).unwrap_or(&pos.entry_price);
        let notional = pos.size * mark_price;
        let pnl = calculate_unrealized_pnl(pos, mark_price);
        
        let maint_margin = required_maintenance_margin(notional, None);
        total_margin_required += maint_margin;

        let health = margin_health(remaining_collateral + pnl, 0.0, notional);
        if health < DEFAULT_MAINTENANCE_MARGIN_BPS {
            return false;
        }
    }

    remaining_collateral >= total_margin_required || account.positions.is_empty()
}

pub fn is_liquidatable(
    collateral: f64,
    unrealized_pnl: f64,
    notional: f64,
    maintenance_margin_bps: Option<f64>,
) -> bool {
    let maint = maintenance_margin_bps.unwrap_or(DEFAULT_MAINTENANCE_MARGIN_BPS);
    let health = margin_health(collateral, unrealized_pnl, notional);
    health < maint
}

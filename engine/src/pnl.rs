use std::collections::HashMap;
use crate::types::{Position, Side, TraderAccount};

pub fn calculate_unrealized_pnl(position: &Position, mark_price: f64) -> f64 {
    match position.side {
        Side::Long => (mark_price - position.entry_price) * position.size,
        Side::Short => (position.entry_price - mark_price) * position.size,
    }
}

pub fn settle_pnl(position: &Position, exit_price: f64, account: &mut TraderAccount) -> f64 {
    let realized_pnl = calculate_unrealized_pnl(position, exit_price);

    account.collateral_balance += realized_pnl;
    account.collateral_balance += position.margin_allocated;

    account.positions.retain(|p| p.market != position.market || p.side != position.side);

    realized_pnl
}

pub fn total_unrealized_pnl(account: &TraderAccount, mark_prices: &HashMap<String, f64>) -> f64 {
    account.positions.iter().map(|pos| {
        let mark_price = *mark_prices.get(&pos.market).unwrap_or(&pos.entry_price);
        calculate_unrealized_pnl(pos, mark_price)
    }).sum()
}

use crate::types::{Position, Side, FUNDING_FACTOR, MAX_FUNDING_RATE_BPS};

pub fn compute_funding_rate(mark_price: f64, index_price: f64) -> Result<f64, &'static str> {
    if index_price <= 0.0 {
        return Err("Index price must be positive");
    }

    let raw_rate = ((mark_price - index_price) * FUNDING_FACTOR) / index_price;

    Ok(raw_rate.clamp(-MAX_FUNDING_RATE_BPS, MAX_FUNDING_RATE_BPS))
}

pub fn apply_funding(position: &mut Position, funding_rate: f64) -> f64 {
    let notional = position.size * position.entry_price;
    let payment = (notional * funding_rate) / FUNDING_FACTOR;

    if position.side == Side::Long {
        position.unrealized_pnl -= payment;
        payment
    } else {
        position.unrealized_pnl += payment;
        -payment
    }
}

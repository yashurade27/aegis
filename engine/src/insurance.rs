use crate::types::{Fill, InsuranceFund, BPS_DENOMINATOR};

pub fn create_insurance_fund() -> InsuranceFund {
    InsuranceFund {
        balance: 0.0,
        total_collected: 0.0,
        total_claimed: 0.0,
    }
}

pub fn route_fee_to_insurance(fill: &Fill, insurance_cut_bps: u32, fund: &mut InsuranceFund) -> f64 {
    let insurance_amount = (fill.fee * (insurance_cut_bps as f64)) / BPS_DENOMINATOR;
    fund.balance += insurance_amount;
    fund.total_collected += insurance_amount;
    insurance_amount
}

pub fn claim_insurance(fund: &mut InsuranceFund, amount: f64) -> Result<f64, &'static str> {
    if amount <= 0.0 {
        return Err("Claim amount must be positive");
    }

    let actual_claim = if amount < fund.balance { amount } else { fund.balance };
    fund.balance -= actual_claim;
    fund.total_claimed += actual_claim;
    Ok(actual_claim)
}

pub fn can_admin_withdraw(fund: &InsuranceFund, amount: f64, min_buffer: Option<f64>) -> bool {
    let min_buffer = min_buffer.unwrap_or(10000.0);
    if amount <= 0.0 {
        return false;
    }
    fund.balance - amount >= min_buffer
}

pub fn admin_withdraw(fund: &mut InsuranceFund, amount: f64, min_buffer: Option<f64>) -> bool {
    let min_buffer = min_buffer.unwrap_or(10000.0);
    if !can_admin_withdraw(fund, amount, Some(min_buffer)) {
        return false;
    }
    fund.balance -= amount;
    true
}

use anchor_lang::prelude::*;
use crate::state::Side;

#[event]
pub struct ExchangeInitialized {
    pub admin: Pubkey,
    pub insurance_vault: Pubkey,
}

#[event]
pub struct MarketCreated {
    pub market: Pubkey,
    pub symbol: String,
}

#[event]
pub struct CollateralDeposited {
    pub trader: Pubkey,
    pub amount: u64,
    pub new_balance: u64,
}

#[event]
pub struct CollateralWithdrawn {
    pub trader: Pubkey,
    pub amount: u64,
    pub new_balance: u64,
}

#[event]
pub struct TradeEvent {
    pub market: Pubkey,
    pub maker: Pubkey,
    pub taker: Pubkey,
    pub price: u64,
    pub size: u64,
    pub fee: u64,
    pub side: Side,
}

#[event]
pub struct OrderCancelled {
    pub market: Pubkey,
    pub trader: Pubkey,
    pub order_id: u64,
}

#[event]
pub struct FundingSettled {
    pub market: Pubkey,
    pub funding_rate_bps: i64,
    pub timestamp: i64,
}

#[event]
pub struct PositionLiquidated {
    pub trader: Pubkey,
    pub market: Pubkey,
    pub side: Side,
    pub penalty: u64,
}

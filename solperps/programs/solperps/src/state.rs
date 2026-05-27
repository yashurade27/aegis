use anchor_lang::prelude::*;

pub const MAX_SYMBOL_LEN: usize = 16;
pub const MAX_ASSET_LEN: usize = 8;
pub const BPS_DENOMINATOR: u64 = 10_000;
pub const MAX_FUNDING_RATE_BPS: i64 = 75;
pub const DEFAULT_MAINTENANCE_MARGIN_BPS: u64 = 500;
pub const MIN_INSURANCE_BUFFER: u64 = 10_000_000_000;
pub const PRICE_SCALE: u64 = 1_000_000;
pub const MAX_LEVERAGE: u8 = 10;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Side {
    Long,
    Short,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum OrderType {
    Limit,
    Market,
}

#[account]
#[derive(InitSpace)]
pub struct Exchange {
    pub admin: Pubkey,
    pub usdc_mint: Pubkey,
    pub insurance_vault: Pubkey,
    pub insurance_balance: u64,
    pub total_collected: u64,
    pub total_claimed: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub exchange: Pubkey,
    #[max_len(MAX_SYMBOL_LEN)]
    pub symbol: String,
    #[max_len(MAX_ASSET_LEN)]
    pub base_asset: String,
    #[max_len(MAX_ASSET_LEN)]
    pub quote_asset: String,
    pub mark_price: u64,
    pub index_price: u64,
    pub open_interest: u64,
    pub fee_bps: u16,
    pub insurance_fund_cut_bps: u16,
    pub next_order_id: u64,
    pub last_funding_ts: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct TraderAccount {
    pub owner: Pubkey,
    pub exchange: Pubkey,
    pub collateral: u64,
    pub locked_margin: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub trader: Pubkey,
    pub market: Pubkey,
    pub side: Side,
    pub size: u64,
    pub entry_price: u64,
    pub margin_allocated: u64,
    pub unrealized_pnl: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Order {
    pub market: Pubkey,
    pub trader: Pubkey,
    pub order_id: u64,
    pub side: Side,
    pub order_type: OrderType,
    pub price: u64,
    pub size: u64,
    pub leverage: u8,
    pub timestamp: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct MockOracle {
    pub market: Pubkey,
    pub price: u64,
    pub authority: Pubkey,
    pub bump: u8,
}

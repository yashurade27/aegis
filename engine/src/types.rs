#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum Side {
    Long,
    Short,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum OrderType {
    Limit,
    Market,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Order {
    pub id: u64,
    pub trader: String,
    pub side: Side,
    pub order_type: OrderType,
    pub price: f64,
    pub size: f64,
    pub timestamp: f64, // TS date.now() is a large number
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Fill {
    pub maker: String,
    pub taker: String,
    pub price: f64,
    pub size: f64,
    pub fee: f64,
    pub side: Side,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Position {
    pub market: String,
    pub side: Side,
    pub size: f64,
    pub entry_price: f64,
    pub margin_allocated: f64,
    pub unrealized_pnl: f64,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Market {
    pub address: String,
    pub base_asset: String,
    pub quote_asset: String,
    pub bids: Vec<Order>,
    pub asks: Vec<Order>,
    pub best_bid: f64,
    pub best_ask: f64,
    pub open_interest: f64,
    pub mark_price: f64,
    pub index_price: f64,
    pub fee_bps: u32,
    pub insurance_fund_cut_bps: u32,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraderAccount {
    pub owner: String,
    pub collateral_balance: f64,
    pub positions: Vec<Position>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InsuranceFund {
    pub balance: f64,
    pub total_collected: f64,
    pub total_claimed: f64,
}

pub const MAX_FUNDING_RATE_BPS: f64 = 75.0;
pub const FUNDING_FACTOR: f64 = 10000.0;
pub const DEFAULT_MAINTENANCE_MARGIN_BPS: f64 = 500.0;
pub const BPS_DENOMINATOR: f64 = 10000.0;

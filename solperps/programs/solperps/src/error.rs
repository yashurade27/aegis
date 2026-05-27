use anchor_lang::prelude::*;

#[error_code]
pub enum SolPerpsError {
    #[msg("Leverage must be between 1 and 10")]
    InvalidLeverage,
    #[msg("Insufficient collateral for margin requirement")]
    InsufficientMargin,
    #[msg("Insufficient liquidity to fill market order")]
    InsufficientLiquidity,
    #[msg("Order size must be greater than zero")]
    InvalidOrderSize,
    #[msg("Order not found or not owned by trader")]
    OrderNotFound,
    #[msg("Withdrawal would breach maintenance margin")]
    WithdrawalBreachesMargin,
    #[msg("Position is not liquidatable")]
    NotLiquidatable,
    #[msg("Position not found")]
    PositionNotFound,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Invalid maker order for matching")]
    InvalidMakerOrder,
    #[msg("Invalid market symbol")]
    InvalidSymbol,
}

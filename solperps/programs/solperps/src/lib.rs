use anchor_lang::prelude::*;

pub mod error;
pub mod events;
pub mod math;
pub mod state;
pub mod instructions;

pub use instructions::cancel_order::*;
pub use instructions::create_market::*;
pub use instructions::deposit_collateral::*;
pub use instructions::initialize_exchange::*;
pub use instructions::initialize_oracle::*;
pub use instructions::initialize_trader::*;
pub use instructions::liquidate_position::*;
pub use instructions::place_order::*;
pub use instructions::settle_funding::*;
pub use instructions::update_oracle::*;
pub use instructions::withdraw_collateral::*;

use crate::state::{OrderType, Side};

declare_id!("AJ3heSpYpqgqMNvJ7L1W1W1RqZfDUixayyyvSedRGAAT");

#[program]
pub mod solperps {
    use super::*;

    pub fn initialize_exchange(ctx: Context<InitializeExchange>) -> Result<()> {
        instructions::initialize_exchange::handler(ctx)
    }

    pub fn create_market(
        ctx: Context<CreateMarket>,
        symbol: String,
        base_asset: String,
        quote_asset: String,
        fee_bps: u16,
        insurance_fund_cut_bps: u16,
    ) -> Result<()> {
        instructions::create_market::handler(
            ctx,
            symbol,
            base_asset,
            quote_asset,
            fee_bps,
            insurance_fund_cut_bps,
        )
    }

    pub fn initialize_trader(ctx: Context<InitializeTrader>) -> Result<()> {
        instructions::initialize_trader::handler(ctx)
    }

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
        instructions::deposit_collateral::handler(ctx, amount)
    }

    pub fn withdraw_collateral(ctx: Context<WithdrawCollateral>, amount: u64) -> Result<()> {
        instructions::withdraw_collateral::handler(ctx, amount)
    }

    pub fn place_order(
        ctx: Context<PlaceOrder>,
        side: Side,
        order_type: OrderType,
        price: u64,
        size: u64,
        leverage: u8,
        order_id: u64,
    ) -> Result<()> {
        instructions::place_order::handler(ctx, side, order_type, price, size, leverage, order_id)
    }

    pub fn cancel_order(ctx: Context<CancelOrder>, order_id: u64) -> Result<()> {
        instructions::cancel_order::handler(ctx, order_id)
    }

    pub fn settle_funding(ctx: Context<SettleFunding>) -> Result<()> {
        instructions::settle_funding::handler(ctx)
    }

    pub fn liquidate_position(ctx: Context<LiquidatePosition>) -> Result<()> {
        instructions::liquidate_position::handler(ctx)
    }

    pub fn initialize_oracle(
        ctx: Context<InitializeOracle>,
        symbol: String,
        initial_price: u64,
    ) -> Result<()> {
        instructions::initialize_oracle::handler(ctx, symbol, initial_price)
    }

    pub fn update_oracle(ctx: Context<UpdateOracle>, new_price: u64) -> Result<()> {
        instructions::update_oracle::handler(ctx, new_price)
    }
}

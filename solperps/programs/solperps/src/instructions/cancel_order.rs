use anchor_lang::prelude::*;
use crate::error::SolPerpsError;
use crate::events::OrderCancelled;
use crate::math::{notional, required_initial_margin};
use crate::state::{Market, Order, TraderAccount};

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct CancelOrder<'info> {
    #[account(mut)]
    pub trader: Signer<'info>,

    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"trader", trader.key().as_ref()],
        bump = trader_account.bump,
        constraint = trader_account.owner == trader.key() @ SolPerpsError::Unauthorized,
    )]
    pub trader_account: Account<'info, TraderAccount>,

    #[account(
        mut,
        close = trader,
        seeds = [b"order", market.key().as_ref(), &order_id.to_le_bytes()],
        bump = order.bump,
        has_one = trader @ SolPerpsError::OrderNotFound,
        has_one = market @ SolPerpsError::OrderNotFound,
    )]
    pub order: Account<'info, Order>,
}

pub fn handler(ctx: Context<CancelOrder>, order_id: u64) -> Result<()> {
    let order = &ctx.accounts.order;
    let unlock_notional = notional(order.size, order.price)?;
    let unlock_margin = required_initial_margin(unlock_notional, order.leverage)?;

    let trader = &mut ctx.accounts.trader_account;
    trader.locked_margin = trader.locked_margin.saturating_sub(unlock_margin);

    emit!(OrderCancelled {
        market: ctx.accounts.market.key(),
        trader: ctx.accounts.trader.key(),
        order_id,
    });

    Ok(())
}

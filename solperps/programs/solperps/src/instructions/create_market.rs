use anchor_lang::prelude::*;
use crate::error::SolPerpsError;
use crate::events::MarketCreated;
use crate::state::{Exchange, Market, MAX_SYMBOL_LEN};

#[derive(Accounts)]
#[instruction(symbol: String)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"exchange"],
        bump = exchange.bump,
        has_one = admin @ SolPerpsError::Unauthorized,
    )]
    pub exchange: Account<'info, Exchange>,

    #[account(
        init,
        payer = admin,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", symbol.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateMarket>,
    symbol: String,
    base_asset: String,
    quote_asset: String,
    fee_bps: u16,
    insurance_fund_cut_bps: u16,
) -> Result<()> {
    require!(!symbol.is_empty() && symbol.len() <= MAX_SYMBOL_LEN, SolPerpsError::InvalidSymbol);

    let market = &mut ctx.accounts.market;
    market.exchange = ctx.accounts.exchange.key();
    market.symbol = symbol.clone();
    market.base_asset = base_asset;
    market.quote_asset = quote_asset;
    market.mark_price = 0;
    market.index_price = 0;
    market.open_interest = 0;
    market.fee_bps = fee_bps;
    market.insurance_fund_cut_bps = insurance_fund_cut_bps;
    market.next_order_id = 1;
    market.last_funding_ts = Clock::get()?.unix_timestamp;
    market.bump = ctx.bumps.market;

    emit!(MarketCreated {
        market: market.key(),
        symbol,
    });

    Ok(())
}

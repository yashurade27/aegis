use anchor_lang::prelude::*;
use crate::error::SolPerpsError;
use crate::state::{Exchange, Market, MockOracle};

#[derive(Accounts)]
#[instruction(symbol: String)]
pub struct InitializeOracle<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"exchange"],
        bump = exchange.bump,
        has_one = admin @ SolPerpsError::Unauthorized,
    )]
    pub exchange: Account<'info, Exchange>,

    #[account(
        mut,
        seeds = [b"market", symbol.as_bytes()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = admin,
        space = 8 + MockOracle::INIT_SPACE,
        seeds = [b"oracle", market.key().as_ref()],
        bump
    )]
    pub oracle: Account<'info, MockOracle>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeOracle>, _symbol: String, initial_price: u64) -> Result<()> {
    require!(initial_price > 0, SolPerpsError::InvalidPrice);

    let oracle = &mut ctx.accounts.oracle;
    oracle.market = ctx.accounts.market.key();
    oracle.price = initial_price;
    oracle.authority = ctx.accounts.admin.key();
    oracle.bump = ctx.bumps.oracle;

    let market = &mut ctx.accounts.market;
    market.mark_price = initial_price;
    market.index_price = initial_price;

    Ok(())
}

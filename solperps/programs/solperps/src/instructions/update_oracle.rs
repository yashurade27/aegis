use anchor_lang::prelude::*;
use crate::error::SolPerpsError;
use crate::state::{Market, MockOracle};

#[derive(Accounts)]
pub struct UpdateOracle<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ SolPerpsError::Unauthorized,
    )]
    pub oracle: Account<'info, MockOracle>,

    #[account(
        mut,
        constraint = market.key() == oracle.market @ SolPerpsError::Unauthorized,
    )]
    pub market: Account<'info, Market>,
}

pub fn handler(ctx: Context<UpdateOracle>, new_price: u64) -> Result<()> {
    require!(new_price > 0, SolPerpsError::InvalidPrice);

    ctx.accounts.oracle.price = new_price;
    let market = &mut ctx.accounts.market;
    market.mark_price = new_price;
    market.index_price = new_price;

    Ok(())
}

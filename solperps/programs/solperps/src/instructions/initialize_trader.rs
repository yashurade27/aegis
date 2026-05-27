use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::error::SolPerpsError;
use crate::state::{Exchange, TraderAccount};

#[derive(Accounts)]
pub struct InitializeTrader<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"exchange"],
        bump = exchange.bump,
    )]
    pub exchange: Account<'info, Exchange>,

    #[account(
        init,
        payer = owner,
        space = 8 + TraderAccount::INIT_SPACE,
        seeds = [b"trader", owner.key().as_ref()],
        bump
    )]
    pub trader_account: Account<'info, TraderAccount>,

    #[account(
        init,
        payer = owner,
        token::mint = usdc_mint,
        token::authority = trader_account,
        seeds = [b"trader_vault", owner.key().as_ref()],
        bump
    )]
    pub trader_vault: Account<'info, TokenAccount>,

    #[account(constraint = usdc_mint.key() == exchange.usdc_mint @ SolPerpsError::Unauthorized)]
    pub usdc_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializeTrader>) -> Result<()> {
    let trader = &mut ctx.accounts.trader_account;
    trader.owner = ctx.accounts.owner.key();
    trader.exchange = ctx.accounts.exchange.key();
    trader.collateral = 0;
    trader.locked_margin = 0;
    trader.bump = ctx.bumps.trader_account;
    Ok(())
}

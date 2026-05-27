use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::events::ExchangeInitialized;
use crate::state::Exchange;

#[derive(Accounts)]
pub struct InitializeExchange<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = admin,
        space = 8 + Exchange::INIT_SPACE,
        seeds = [b"exchange"],
        bump
    )]
    pub exchange: Account<'info, Exchange>,

    #[account(
        init,
        payer = admin,
        token::mint = usdc_mint,
        token::authority = exchange,
        seeds = [b"insurance_vault"],
        bump
    )]
    pub insurance_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializeExchange>) -> Result<()> {
    let exchange = &mut ctx.accounts.exchange;
    exchange.admin = ctx.accounts.admin.key();
    exchange.usdc_mint = ctx.accounts.usdc_mint.key();
    exchange.insurance_vault = ctx.accounts.insurance_vault.key();
    exchange.insurance_balance = 0;
    exchange.total_collected = 0;
    exchange.total_claimed = 0;
    exchange.bump = ctx.bumps.exchange;

    emit!(ExchangeInitialized {
        admin: exchange.admin,
        insurance_vault: exchange.insurance_vault,
    });

    Ok(())
}

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::error::SolPerpsError;
use crate::events::CollateralDeposited;
use crate::state::{Exchange, TraderAccount};

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"exchange"],
        bump = exchange.bump,
    )]
    pub exchange: Account<'info, Exchange>,

    #[account(
        mut,
        seeds = [b"trader", owner.key().as_ref()],
        bump = trader_account.bump,
        has_one = owner @ SolPerpsError::Unauthorized,
        has_one = exchange @ SolPerpsError::Unauthorized,
    )]
    pub trader_account: Account<'info, TraderAccount>,

    #[account(
        mut,
        seeds = [b"trader_vault", owner.key().as_ref()],
        bump,
    )]
    pub trader_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
    require!(amount > 0, SolPerpsError::InvalidOrderSize);

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.owner_token_account.to_account_info(),
                to: ctx.accounts.trader_vault.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        ),
        amount,
    )?;

    let trader = &mut ctx.accounts.trader_account;
    trader.collateral = trader
        .collateral
        .checked_add(amount)
        .ok_or(SolPerpsError::MathOverflow)?;

    emit!(CollateralDeposited {
        trader: trader.owner,
        amount,
        new_balance: trader.collateral,
    });

    Ok(())
}

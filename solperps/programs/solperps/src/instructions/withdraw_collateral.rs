use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::error::SolPerpsError;
use crate::events::CollateralWithdrawn;
use crate::math::{can_withdraw, calculate_unrealized_pnl, notional};
use crate::state::{Exchange, Market, Position, Side, TraderAccount};

#[derive(Accounts)]
pub struct WithdrawCollateral<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    pub market: Account<'info, Market>,

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

    #[account(
        seeds = [
            b"position",
            owner.key().as_ref(),
            market.key().as_ref(),
            &[Side::Long as u8],
        ],
        bump,
    )]
    pub long_position: Option<Account<'info, Position>>,

    #[account(
        seeds = [
            b"position",
            owner.key().as_ref(),
            market.key().as_ref(),
            &[Side::Short as u8],
        ],
        bump,
    )]
    pub short_position: Option<Account<'info, Position>>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<WithdrawCollateral>, amount: u64) -> Result<()> {
    require!(amount > 0, SolPerpsError::InvalidOrderSize);

    let mark_price = ctx.accounts.market.mark_price;
    let mut total_notional = 0u64;
    let mut total_pnl = 0i64;

    if let Some(pos) = &ctx.accounts.long_position {
        if pos.size > 0 {
            total_notional = total_notional
                .checked_add(notional(pos.size, mark_price)?)
                .ok_or(SolPerpsError::MathOverflow)?;
            total_pnl = total_pnl
                .checked_add(calculate_unrealized_pnl(
                    pos.side,
                    pos.size,
                    pos.entry_price,
                    mark_price,
                )?)
                .ok_or(SolPerpsError::MathOverflow)?;
        }
    }

    if let Some(pos) = &ctx.accounts.short_position {
        if pos.size > 0 {
            total_notional = total_notional
                .checked_add(notional(pos.size, mark_price)?)
                .ok_or(SolPerpsError::MathOverflow)?;
            total_pnl = total_pnl
                .checked_add(calculate_unrealized_pnl(
                    pos.side,
                    pos.size,
                    pos.entry_price,
                    mark_price,
                )?)
                .ok_or(SolPerpsError::MathOverflow)?;
        }
    }

    let trader = &ctx.accounts.trader_account;
    require!(
        can_withdraw(
            trader.collateral,
            amount,
            trader.locked_margin,
            total_pnl,
            total_notional,
        )?,
        SolPerpsError::WithdrawalBreachesMargin
    );

    let owner_key = ctx.accounts.owner.key();
    let bump = trader.bump;
    let seeds: &[&[u8]] = &[b"trader", owner_key.as_ref(), &[bump]];
    let signer = &[seeds];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.trader_vault.to_account_info(),
                to: ctx.accounts.owner_token_account.to_account_info(),
                authority: ctx.accounts.trader_account.to_account_info(),
            },
            signer,
        ),
        amount,
    )?;

    let trader = &mut ctx.accounts.trader_account;
    trader.collateral = trader
        .collateral
        .checked_sub(amount)
        .ok_or(SolPerpsError::MathOverflow)?;

    emit!(CollateralWithdrawn {
        trader: trader.owner,
        amount,
        new_balance: trader.collateral,
    });

    Ok(())
}

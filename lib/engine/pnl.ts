// ============================================================================
// Aegis Vault — PnL Settlement
// Calculate unrealized PnL and settle (close) positions.
// ============================================================================

import { type Position, type TraderAccount, Side } from './types';

/**
 * Calculate unrealized PnL for a position at a given mark price.
 *
 * Long:  PnL = (markPrice - entryPrice) * size
 * Short: PnL = (entryPrice - markPrice) * size
 */
export function calculateUnrealizedPnl(
  position: Position,
  markPrice: number
): number {
  if (position.side === Side.Long) {
    return (markPrice - position.entryPrice) * position.size;
  } else {
    return (position.entryPrice - markPrice) * position.size;
  }
}

/**
 * Settle (close) a position at a given exit price.
 * Calculates realized PnL, adds/subtracts from collateral balance,
 * and removes the position from the account.
 *
 * Returns the realized PnL.
 */
export function settlePnl(
  position: Position,
  exitPrice: number,
  account: TraderAccount
): number {
  const realizedPnl = calculateUnrealizedPnl(position, exitPrice);

  // Add realized PnL to collateral (can be negative)
  account.collateralBalance += realizedPnl;

  // Return margin to collateral
  account.collateralBalance += position.marginAllocated;

  // Remove position from account
  const idx = account.positions.indexOf(position);
  if (idx !== -1) {
    account.positions.splice(idx, 1);
  }

  return realizedPnl;
}

/**
 * Calculate total unrealized PnL across all positions in an account.
 */
export function totalUnrealizedPnl(
  account: TraderAccount,
  markPrices: Map<string, number>
): number {
  return account.positions.reduce((total, pos) => {
    const markPrice = markPrices.get(pos.market) ?? pos.entryPrice;
    return total + calculateUnrealizedPnl(pos, markPrice);
  }, 0);
}

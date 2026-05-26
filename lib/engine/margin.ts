// ============================================================================
// Aegis Vault — Margin & Liquidation System
// Pure calculation functions for margin requirements and liquidation.
// ============================================================================

import {
  type TraderAccount,
  Side,
  DEFAULT_MAINTENANCE_MARGIN_BPS,
  BPS_DENOMINATOR,
} from './types';
import { calculateUnrealizedPnl } from './pnl';

/**
 * Calculate initial margin required for a position.
 * initialMargin = notional / leverage
 */
export function requiredInitialMargin(
  notional: number,
  leverage: number
): number {
  if (leverage <= 0) throw new Error('Leverage must be positive');
  return notional / leverage;
}

/**
 * Calculate maintenance margin required.
 * maintenanceMargin = notional * maintenanceMarginBps / 10000
 * Default: 5% (500 bps)
 */
export function requiredMaintenanceMargin(
  notional: number,
  maintenanceMarginBps: number = DEFAULT_MAINTENANCE_MARGIN_BPS
): number {
  return (notional * maintenanceMarginBps) / BPS_DENOMINATOR;
}

/**
 * Calculate margin health in basis points.
 * health = (collateral + unrealizedPnl) / notional * 10000
 * Higher is healthier. Below maintenance margin bps = liquidatable.
 */
export function marginHealth(
  collateral: number,
  unrealizedPnl: number,
  notional: number
): number {
  if (notional === 0) return BPS_DENOMINATOR; // No position = max health
  return ((collateral + unrealizedPnl) / notional) * BPS_DENOMINATOR;
}

/**
 * Calculate the liquidation price for a position.
 *
 * For longs:
 *   liqPrice = entry * (1 - 1/leverage + maintenanceMarginBps/10000)
 *   Simplified: liqPrice = entry * (1 - (1/leverage - maint/10000))
 *
 * For shorts:
 *   liqPrice = entry * (1 + 1/leverage - maintenanceMarginBps/10000)
 *   Simplified: liqPrice = entry * (1 + (1/leverage - maint/10000))
 */
export function liquidationPrice(
  entryPrice: number,
  side: Side,
  maintenanceMarginBps: number = DEFAULT_MAINTENANCE_MARGIN_BPS,
  leverage: number = 1
): number {
  if (leverage <= 0) throw new Error('Leverage must be positive');

  const marginFraction = 1 / leverage;
  const maintFraction = maintenanceMarginBps / BPS_DENOMINATOR;

  if (side === Side.Long) {
    // Long liquidation: price drops below entry - (margin - maintenance)
    return entryPrice * (1 - marginFraction + maintFraction);
  } else {
    // Short liquidation: price rises above entry + (margin - maintenance)
    return entryPrice * (1 + marginFraction - maintFraction);
  }
}

/**
 * Check if a trader can withdraw a given amount without going below
 * initial margin requirements.
 */
export function canWithdraw(
  account: TraderAccount,
  amount: number,
  markPrices: Map<string, number>
): boolean {
  if (amount > account.collateralBalance) return false;

  const remainingCollateral = account.collateralBalance - amount;

  // Calculate total margin required across all positions
  let totalMarginRequired = 0;
  for (const pos of account.positions) {
    const markPrice = markPrices.get(pos.market) ?? pos.entryPrice;
    const notional = pos.size * markPrice;
    const pnl = calculateUnrealizedPnl(pos, markPrice);
    // After withdrawal, need at least maintenance margin
    const maintMargin = requiredMaintenanceMargin(notional);
    totalMarginRequired += maintMargin;

    // Check health with remaining collateral
    const health = marginHealth(remainingCollateral + pnl, 0, notional);
    if (health < DEFAULT_MAINTENANCE_MARGIN_BPS) {
      return false;
    }
  }

  return remainingCollateral >= totalMarginRequired || account.positions.length === 0;
}

/**
 * Check if a position is liquidatable (health < maintenance margin).
 */
export function isLiquidatable(
  collateral: number,
  unrealizedPnl: number,
  notional: number,
  maintenanceMarginBps: number = DEFAULT_MAINTENANCE_MARGIN_BPS
): boolean {
  const health = marginHealth(collateral, unrealizedPnl, notional);
  return health < maintenanceMarginBps;
}

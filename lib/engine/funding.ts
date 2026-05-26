// ============================================================================
// Aegis Vault — Funding Rate Calculation & Application
// Implements hourly funding rate with ±75bps cap.
// ============================================================================

import {
  type Position,
  Side,
  MAX_FUNDING_RATE_BPS,
  FUNDING_FACTOR,
} from './types';

/**
 * Compute the funding rate given mark and index prices.
 * Formula: (mark - index) * FUNDING_FACTOR / index
 * Result is in basis points, capped at ±75 bps per hour.
 *
 * Positive rate: longs pay shorts.
 * Negative rate: shorts pay longs.
 */
export function computeFundingRate(
  markPrice: number,
  indexPrice: number
): number {
  if (indexPrice <= 0) throw new Error('Index price must be positive');

  const rawRate =
    ((markPrice - indexPrice) * FUNDING_FACTOR) / indexPrice;

  // Cap at ±75 bps
  return Math.max(
    -MAX_FUNDING_RATE_BPS,
    Math.min(MAX_FUNDING_RATE_BPS, rawRate)
  );
}

/**
 * Apply a funding rate to a position.
 * Longs pay when rate > 0, shorts pay when rate < 0.
 * Payment = position.size * position.entryPrice * fundingRate / FUNDING_FACTOR
 *
 * Mutates position.unrealizedPnl.
 * Returns the funding payment amount (positive = paid out, negative = received).
 */
export function applyFunding(
  position: Position,
  fundingRate: number
): number {
  const notional = position.size * position.entryPrice;
  const payment = (notional * fundingRate) / FUNDING_FACTOR;

  if (position.side === Side.Long) {
    // Longs pay when rate is positive (mark > index)
    position.unrealizedPnl -= payment;
    return payment;
  } else {
    // Shorts receive when rate is positive (mark > index)
    position.unrealizedPnl += payment;
    return -payment;
  }
}

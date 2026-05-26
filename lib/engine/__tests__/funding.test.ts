// ============================================================================
// Tests — Funding Rate
// ============================================================================

import { describe, it, expect } from 'vitest';
import { computeFundingRate, applyFunding } from '../funding';
import { type Position, Side, MAX_FUNDING_RATE_BPS } from '../types';

describe('computeFundingRate', () => {
  it('returns positive rate when mark > index', () => {
    // (110 - 100) * 10000 / 100 = 1000 bps → capped to 75
    const rate = computeFundingRate(110, 100);
    expect(rate).toBe(MAX_FUNDING_RATE_BPS); // Capped at 75
  });

  it('returns negative rate when mark < index', () => {
    const rate = computeFundingRate(90, 100);
    expect(rate).toBe(-MAX_FUNDING_RATE_BPS); // Capped at -75
  });

  it('returns zero when mark equals index', () => {
    expect(computeFundingRate(100, 100)).toBe(0);
  });

  it('calculates small positive rate without hitting cap', () => {
    // (100.5 - 100) * 10000 / 100 = 50 bps (under 75 cap)
    const rate = computeFundingRate(100.5, 100);
    expect(rate).toBe(50);
  });

  it('calculates small negative rate without hitting cap', () => {
    // (99.7 - 100) * 10000 / 100 = -30 bps
    const rate = computeFundingRate(99.7, 100);
    expect(rate).toBeCloseTo(-30);
  });

  it('caps at +75 bps', () => {
    const rate = computeFundingRate(200, 100);
    expect(rate).toBe(MAX_FUNDING_RATE_BPS);
  });

  it('caps at -75 bps', () => {
    const rate = computeFundingRate(50, 100);
    expect(rate).toBe(-MAX_FUNDING_RATE_BPS);
  });

  it('throws for zero index price', () => {
    expect(() => computeFundingRate(100, 0)).toThrow('Index price must be positive');
  });

  it('throws for negative index price', () => {
    expect(() => computeFundingRate(100, -10)).toThrow('Index price must be positive');
  });
});

describe('applyFunding', () => {
  it('longs pay when funding rate is positive', () => {
    const position: Position = {
      market: 'SOL-PERP',
      side: Side.Long,
      size: 10,
      entryPrice: 100,
      marginAllocated: 200,
      unrealizedPnl: 0,
    };

    const payment = applyFunding(position, 50); // 50 bps positive

    // notional = 10 * 100 = 1000
    // payment = 1000 * 50 / 10000 = 5
    expect(payment).toBe(5);
    expect(position.unrealizedPnl).toBe(-5); // Long pays
  });

  it('shorts receive when funding rate is positive', () => {
    const position: Position = {
      market: 'SOL-PERP',
      side: Side.Short,
      size: 10,
      entryPrice: 100,
      marginAllocated: 200,
      unrealizedPnl: 0,
    };

    const payment = applyFunding(position, 50);

    // short receives 5, so payment returned is negative (they didn't pay)
    expect(payment).toBe(-5);
    expect(position.unrealizedPnl).toBe(5); // Short receives
  });

  it('longs receive when funding rate is negative', () => {
    const position: Position = {
      market: 'SOL-PERP',
      side: Side.Long,
      size: 10,
      entryPrice: 100,
      marginAllocated: 200,
      unrealizedPnl: 0,
    };

    const payment = applyFunding(position, -30);

    // payment = 1000 * -30 / 10000 = -3
    expect(payment).toBe(-3); // Negative = received
    expect(position.unrealizedPnl).toBe(3); // Long receives
  });

  it('accumulates with existing unrealized PnL', () => {
    const position: Position = {
      market: 'SOL-PERP',
      side: Side.Long,
      size: 10,
      entryPrice: 100,
      marginAllocated: 200,
      unrealizedPnl: 50,
    };

    applyFunding(position, 20);

    // payment = 1000 * 20 / 10000 = 2
    expect(position.unrealizedPnl).toBe(48); // 50 - 2
  });
});

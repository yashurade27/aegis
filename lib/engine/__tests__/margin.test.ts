// ============================================================================
// Tests — Margin & Liquidation System
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  requiredInitialMargin,
  requiredMaintenanceMargin,
  marginHealth,
  liquidationPrice,
  canWithdraw,
  isLiquidatable,
} from '../margin';
import { type TraderAccount, Side, BPS_DENOMINATOR } from '../types';

describe('requiredInitialMargin', () => {
  it('calculates initial margin at 5x leverage', () => {
    // $10,000 notional / 5x = $2,000
    expect(requiredInitialMargin(10000, 5)).toBe(2000);
  });

  it('calculates initial margin at 1x leverage (no leverage)', () => {
    expect(requiredInitialMargin(10000, 1)).toBe(10000);
  });

  it('calculates initial margin at 10x leverage', () => {
    expect(requiredInitialMargin(10000, 10)).toBe(1000);
  });

  it('throws for zero leverage', () => {
    expect(() => requiredInitialMargin(10000, 0)).toThrow('Leverage must be positive');
  });

  it('throws for negative leverage', () => {
    expect(() => requiredInitialMargin(10000, -1)).toThrow('Leverage must be positive');
  });
});

describe('requiredMaintenanceMargin', () => {
  it('calculates maintenance margin at default 5% (500 bps)', () => {
    // $10,000 * 500 / 10000 = $500
    expect(requiredMaintenanceMargin(10000)).toBe(500);
  });

  it('calculates maintenance margin at custom 3% (300 bps)', () => {
    expect(requiredMaintenanceMargin(10000, 300)).toBe(300);
  });

  it('returns zero for zero notional', () => {
    expect(requiredMaintenanceMargin(0)).toBe(0);
  });
});

describe('marginHealth', () => {
  it('returns max health with no position', () => {
    expect(marginHealth(1000, 0, 0)).toBe(BPS_DENOMINATOR);
  });

  it('calculates health correctly with positive PnL', () => {
    // (1000 + 500) / 10000 * 10000 = 1500 bps
    expect(marginHealth(1000, 500, 10000)).toBe(1500);
  });

  it('calculates health with negative PnL', () => {
    // (1000 - 800) / 10000 * 10000 = 200 bps
    expect(marginHealth(1000, -800, 10000)).toBe(200);
  });

  it('can go negative', () => {
    // (100 - 500) / 1000 * 10000 = -4000 bps
    expect(marginHealth(100, -500, 1000)).toBe(-4000);
  });
});

describe('liquidationPrice', () => {
  it('calculates liquidation price for long at 5x leverage', () => {
    // entry=100, 5x leverage => margin = 20%, maint = 5%
    // liqPrice = 100 * (1 - 0.2 + 0.05) = 100 * 0.85 = 85
    const liqPrice = liquidationPrice(100, Side.Long, 500, 5);
    expect(liqPrice).toBeCloseTo(85);
  });

  it('calculates liquidation price for short at 5x leverage', () => {
    // entry=100, 5x leverage => margin = 20%, maint = 5%
    // liqPrice = 100 * (1 + 0.2 - 0.05) = 100 * 1.15 = 115
    const liqPrice = liquidationPrice(100, Side.Short, 500, 5);
    expect(liqPrice).toBeCloseTo(115);
  });

  it('long liquidation price is below entry', () => {
    const liqPrice = liquidationPrice(100, Side.Long, 500, 3);
    expect(liqPrice).toBeLessThan(100);
  });

  it('short liquidation price is above entry', () => {
    const liqPrice = liquidationPrice(100, Side.Short, 500, 3);
    expect(liqPrice).toBeGreaterThan(100);
  });

  it('higher leverage = tighter liquidation price for longs', () => {
    const liq3x = liquidationPrice(100, Side.Long, 500, 3);
    const liq10x = liquidationPrice(100, Side.Long, 500, 10);
    expect(liq10x).toBeGreaterThan(liq3x); // 10x liq is closer to entry
  });

  it('throws for zero leverage', () => {
    expect(() => liquidationPrice(100, Side.Long, 500, 0)).toThrow();
  });
});

describe('isLiquidatable', () => {
  it('returns true when health < maintenance margin', () => {
    // health = (100 - 80) / 1000 * 10000 = 200 bps < 500 bps maintenance
    expect(isLiquidatable(100, -80, 1000, 500)).toBe(true);
  });

  it('returns false when health >= maintenance margin', () => {
    // health = (1000 + 0) / 10000 * 10000 = 1000 bps > 500 bps
    expect(isLiquidatable(1000, 0, 10000, 500)).toBe(false);
  });

  it('returns true when collateral + pnl is negative', () => {
    expect(isLiquidatable(100, -200, 1000, 500)).toBe(true);
  });
});

describe('canWithdraw', () => {
  it('allows full withdrawal when no positions', () => {
    const account: TraderAccount = {
      owner: 'trader-1',
      collateralBalance: 1000,
      positions: [],
    };
    expect(canWithdraw(account, 1000, new Map())).toBe(true);
  });

  it('rejects withdrawal exceeding balance', () => {
    const account: TraderAccount = {
      owner: 'trader-1',
      collateralBalance: 1000,
      positions: [],
    };
    expect(canWithdraw(account, 1001, new Map())).toBe(false);
  });

  it('rejects withdrawal that would breach maintenance margin', () => {
    const account: TraderAccount = {
      owner: 'trader-1',
      collateralBalance: 600,
      positions: [
        {
          market: 'SOL-PERP',
          side: Side.Long,
          size: 10,
          entryPrice: 100,
          marginAllocated: 200,
          unrealizedPnl: 0,
        },
      ],
    };
    // Notional = 10 * 100 = 1000, maint = 50
    // Withdrawing 590 leaves 10 < 50 maintenance
    const prices = new Map([['SOL-PERP', 100]]);
    expect(canWithdraw(account, 590, prices)).toBe(false);
  });
});

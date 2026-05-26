// ============================================================================
// Tests — PnL Settlement
// ============================================================================

import { describe, it, expect } from 'vitest';
import { calculateUnrealizedPnl, settlePnl, totalUnrealizedPnl } from '../pnl';
import { type Position, type TraderAccount, Side } from '../types';

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    market: 'SOL-PERP',
    side: Side.Long,
    size: 10,
    entryPrice: 100,
    marginAllocated: 200,
    unrealizedPnl: 0,
    ...overrides,
  };
}

describe('calculateUnrealizedPnl', () => {
  it('calculates positive PnL for long when price rises', () => {
    const position = makePosition({ side: Side.Long, entryPrice: 100, size: 10 });
    // (120 - 100) * 10 = 200
    expect(calculateUnrealizedPnl(position, 120)).toBe(200);
  });

  it('calculates negative PnL for long when price drops', () => {
    const position = makePosition({ side: Side.Long, entryPrice: 100, size: 10 });
    // (80 - 100) * 10 = -200
    expect(calculateUnrealizedPnl(position, 80)).toBe(-200);
  });

  it('calculates positive PnL for short when price drops', () => {
    const position = makePosition({ side: Side.Short, entryPrice: 100, size: 10 });
    // (100 - 80) * 10 = 200
    expect(calculateUnrealizedPnl(position, 80)).toBe(200);
  });

  it('calculates negative PnL for short when price rises', () => {
    const position = makePosition({ side: Side.Short, entryPrice: 100, size: 10 });
    // (100 - 120) * 10 = -200
    expect(calculateUnrealizedPnl(position, 120)).toBe(-200);
  });

  it('returns zero when price equals entry', () => {
    const position = makePosition({ entryPrice: 100, size: 10 });
    expect(calculateUnrealizedPnl(position, 100)).toBe(0);
  });
});

describe('settlePnl', () => {
  it('settles a profitable long position', () => {
    const position = makePosition({
      side: Side.Long,
      entryPrice: 100,
      size: 10,
      marginAllocated: 200,
    });

    const account: TraderAccount = {
      owner: 'trader-1',
      collateralBalance: 1000,
      positions: [position],
    };

    const realizedPnl = settlePnl(position, 120, account);

    expect(realizedPnl).toBe(200); // (120-100) * 10
    expect(account.collateralBalance).toBe(1400); // 1000 + 200 pnl + 200 margin returned
    expect(account.positions).toHaveLength(0);
  });

  it('settles a losing short position', () => {
    const position = makePosition({
      side: Side.Short,
      entryPrice: 100,
      size: 5,
      marginAllocated: 100,
    });

    const account: TraderAccount = {
      owner: 'trader-1',
      collateralBalance: 500,
      positions: [position],
    };

    const realizedPnl = settlePnl(position, 110, account);

    expect(realizedPnl).toBe(-50); // (100-110) * 5
    expect(account.collateralBalance).toBe(550); // 500 - 50 + 100 margin
    expect(account.positions).toHaveLength(0);
  });

  it('handles zero PnL settlement', () => {
    const position = makePosition({
      side: Side.Long,
      entryPrice: 100,
      size: 10,
      marginAllocated: 200,
    });

    const account: TraderAccount = {
      owner: 'trader-1',
      collateralBalance: 1000,
      positions: [position],
    };

    const realizedPnl = settlePnl(position, 100, account);

    expect(realizedPnl).toBe(0);
    expect(account.collateralBalance).toBe(1200); // 1000 + 0 + 200 margin
  });
});

describe('totalUnrealizedPnl', () => {
  it('sums PnL across multiple positions', () => {
    const account: TraderAccount = {
      owner: 'trader-1',
      collateralBalance: 1000,
      positions: [
        makePosition({ market: 'SOL-PERP', side: Side.Long, entryPrice: 100, size: 10 }),
        makePosition({ market: 'ETH-PERP', side: Side.Short, entryPrice: 3000, size: 2 }),
      ],
    };

    const prices = new Map([
      ['SOL-PERP', 110],  // +100
      ['ETH-PERP', 2900], // +200
    ]);

    expect(totalUnrealizedPnl(account, prices)).toBe(300);
  });

  it('returns zero with no positions', () => {
    const account: TraderAccount = {
      owner: 'trader-1',
      collateralBalance: 1000,
      positions: [],
    };

    expect(totalUnrealizedPnl(account, new Map())).toBe(0);
  });

  it('uses entry price when mark price not available', () => {
    const account: TraderAccount = {
      owner: 'trader-1',
      collateralBalance: 1000,
      positions: [
        makePosition({ market: 'SOL-PERP', side: Side.Long, entryPrice: 100, size: 10 }),
      ],
    };

    // No mark price for SOL-PERP → fallback to entry → PnL = 0
    expect(totalUnrealizedPnl(account, new Map())).toBe(0);
  });
});

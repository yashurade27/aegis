import {
  matchOrder,
  createMarket,
  marginHealth,
  calculateUnrealizedPnl,
  computeFundingRate,
  requiredInitialMargin,
  liquidationPrice,
  insertOrderIntoBook,
} from '@/engine/pkg/engine';
import { Side, OrderType } from '@/lib/types';
import { fromWasm, type MatchOrderResult } from '@/lib/wasm-utils';

describe('WASM Engine Integration', () => {
  it('should create a market with correct parameters', () => {
    const market = createMarket('SOL-PERP', 'SOL', 'USD', 10, 8000);

    expect(market).toBeDefined();
    expect(market.baseAsset).toBe('SOL');
    expect(market.quoteAsset).toBe('USD');
    expect(market.feeBps).toBe(10);
    expect(market.insuranceFundCutBps).toBe(8000);
  });

  it('should calculate required initial margin', () => {
    expect(requiredInitialMargin(1000, 10)).toBe(100);
    expect(requiredInitialMargin(1000, 5)).toBe(200);
  });

  it('should calculate liquidation price for long position', () => {
    const liquidPrice = liquidationPrice(100, Side.Long, 500, 10);
    expect(liquidPrice).toBeLessThan(100);
    expect(liquidPrice).toBeCloseTo(95);
  });

  it('should calculate liquidation price for short position', () => {
    const liquidPrice = liquidationPrice(100, Side.Short, 500, 10);
    expect(liquidPrice).toBeGreaterThan(100);
    expect(liquidPrice).toBeCloseTo(105);
  });

  it('should calculate margin health', () => {
    const health = marginHealth(1000, 100, 5000);
    expect(health).toBeGreaterThan(0);
    expect(health).toBeCloseTo(2200);
  });

  it('should calculate unrealized PnL for long position', () => {
    const position = {
      market: 'SOL-PERP',
      side: Side.Long,
      size: 10,
      entryPrice: 100,
      marginAllocated: 100,
      unrealizedPnl: 0,
    };

    expect(calculateUnrealizedPnl(position, 110)).toBe(100);
  });

  it('should calculate unrealized PnL for short position', () => {
    const position = {
      market: 'SOL-PERP',
      side: Side.Short,
      size: 10,
      entryPrice: 100,
      marginAllocated: 100,
      unrealizedPnl: 0,
    };

    expect(calculateUnrealizedPnl(position, 90)).toBe(100);
  });

  it('should compute funding rate', () => {
    expect(computeFundingRate(100, 100)).toBe(0);
    expect(computeFundingRate(105, 100)).toBeGreaterThan(0);
    expect(computeFundingRate(95, 100)).toBeLessThan(0);
  });

  it('should match a market order against resting liquidity', () => {
    let market = createMarket('SOL-PERP', 'SOL', 'USD', 10, 8000);
    market = insertOrderIntoBook(market, {
      id: 1,
      trader: 'maker',
      side: Side.Short,
      orderType: OrderType.Limit,
      price: 142.5,
      size: 10,
      timestamp: Date.now(),
    });

    const result = fromWasm<MatchOrderResult>(
      matchOrder(market, {
        id: 2,
        trader: 'taker',
        side: Side.Long,
        orderType: OrderType.Market,
        price: 0,
        size: 1,
        timestamp: Date.now(),
      })
    );

    expect(result.fills).toHaveLength(1);
    expect(result.fills[0].price).toBe(142.5);
    expect(result.fills[0].size).toBe(1);
    expect(result.market.asks[0].size).toBe(9);
  });
});

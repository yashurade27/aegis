// ============================================================================
// Tests — Matching Engine
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  matchOrder,
  insertOrderIntoBook,
  cancelOrder,
  calculateFee,
  createMarket,
} from '../matching';
import { type Market, type Order, Side, OrderType } from '../types';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 1,
    trader: 'trader-1',
    side: Side.Long,
    orderType: OrderType.Limit,
    price: 100,
    size: 10,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('calculateFee', () => {
  it('calculates fee correctly', () => {
    // 10 units * $100 notional = $1,000; 10 bps (0.10%) fee = $1
    expect(calculateFee(10, 100, 10)).toBe(1);
  });

  it('calculates larger fee correctly', () => {
    // 10 units * $100 notional = $1,000; 100 bps (1%) fee = $10
    expect(calculateFee(10, 100, 100)).toBe(10);
  });

  it('returns zero for zero size', () => {
    expect(calculateFee(0, 100, 10)).toBe(0);
  });

  it('returns zero for zero fee bps', () => {
    expect(calculateFee(10, 100, 0)).toBe(0);
  });
});

describe('insertOrderIntoBook', () => {
  let market: Market;

  beforeEach(() => {
    market = createMarket('SOL-PERP', 'SOL', 'USD');
  });

  it('inserts a bid into an empty book', () => {
    const order = makeOrder({ side: Side.Long, price: 100 });
    insertOrderIntoBook(market, order);
    expect(market.bids).toHaveLength(1);
    expect(market.bestBid).toBe(100);
  });

  it('inserts bids in descending price order', () => {
    insertOrderIntoBook(market, makeOrder({ id: 1, side: Side.Long, price: 100, timestamp: 1 }));
    insertOrderIntoBook(market, makeOrder({ id: 2, side: Side.Long, price: 110, timestamp: 2 }));
    insertOrderIntoBook(market, makeOrder({ id: 3, side: Side.Long, price: 105, timestamp: 3 }));

    expect(market.bids.map((b) => b.price)).toEqual([110, 105, 100]);
    expect(market.bestBid).toBe(110);
  });

  it('breaks bid ties by timestamp (earlier first)', () => {
    insertOrderIntoBook(market, makeOrder({ id: 1, side: Side.Long, price: 100, timestamp: 200 }));
    insertOrderIntoBook(market, makeOrder({ id: 2, side: Side.Long, price: 100, timestamp: 100 }));

    expect(market.bids[0].id).toBe(2); // Earlier timestamp first
  });

  it('inserts asks in ascending price order', () => {
    insertOrderIntoBook(market, makeOrder({ id: 1, side: Side.Short, price: 110, timestamp: 1 }));
    insertOrderIntoBook(market, makeOrder({ id: 2, side: Side.Short, price: 100, timestamp: 2 }));
    insertOrderIntoBook(market, makeOrder({ id: 3, side: Side.Short, price: 105, timestamp: 3 }));

    expect(market.asks.map((a) => a.price)).toEqual([100, 105, 110]);
    expect(market.bestAsk).toBe(100);
  });
});

describe('matchOrder', () => {
  let market: Market;

  beforeEach(() => {
    market = createMarket('SOL-PERP', 'SOL', 'USD', 10); // 10 bps fee

    // Pre-fill asks: 5 @ 100, 5 @ 101
    insertOrderIntoBook(market, makeOrder({
      id: 100, trader: 'maker-A', side: Side.Short, price: 100, size: 5, timestamp: 1,
    }));
    insertOrderIntoBook(market, makeOrder({
      id: 101, trader: 'maker-B', side: Side.Short, price: 101, size: 5, timestamp: 2,
    }));
  });

  it('fills a limit buy order fully at best ask', () => {
    const taker = makeOrder({
      id: 200, trader: 'taker-1', side: Side.Long, orderType: OrderType.Limit,
      price: 105, size: 5, timestamp: 10,
    });

    const fills = matchOrder(market, taker);

    expect(fills).toHaveLength(1);
    expect(fills[0].price).toBe(100); // Filled at maker's price
    expect(fills[0].size).toBe(5);
    expect(fills[0].maker).toBe('maker-A');
    expect(fills[0].taker).toBe('taker-1');
    expect(fills[0].fee).toBe(calculateFee(5, 100, 10));
    expect(market.asks).toHaveLength(1); // Only maker-B left
  });

  it('fills a market buy order across multiple price levels', () => {
    const taker = makeOrder({
      id: 201, trader: 'taker-2', side: Side.Long, orderType: OrderType.Market,
      price: 0, size: 8, timestamp: 10,
    });

    const fills = matchOrder(market, taker);

    expect(fills).toHaveLength(2);
    expect(fills[0].price).toBe(100);
    expect(fills[0].size).toBe(5);
    expect(fills[1].price).toBe(101);
    expect(fills[1].size).toBe(3);
    expect(market.asks[0].size).toBe(2); // 5 - 3 = 2 remaining
  });

  it('handles partial fill — remainder becomes resting limit order', () => {
    const taker = makeOrder({
      id: 202, trader: 'taker-3', side: Side.Long, orderType: OrderType.Limit,
      price: 100, size: 8, timestamp: 10,
    });

    const fills = matchOrder(market, taker);

    expect(fills).toHaveLength(1);
    expect(fills[0].size).toBe(5);
    // Remaining 3 should be in bids
    expect(market.bids).toHaveLength(1);
    expect(market.bids[0].size).toBe(3);
    expect(market.bids[0].price).toBe(100);
  });

  it('throws InsufficientLiquidity for unfillable market order', () => {
    const taker = makeOrder({
      id: 203, trader: 'taker-4', side: Side.Long, orderType: OrderType.Market,
      price: 0, size: 20, timestamp: 10, // Only 10 available
    });

    expect(() => matchOrder(market, taker)).toThrow('InsufficientLiquidity');
  });

  it('does not fill limit buy when price is too low', () => {
    const taker = makeOrder({
      id: 204, trader: 'taker-5', side: Side.Long, orderType: OrderType.Limit,
      price: 99, size: 5, timestamp: 10,
    });

    const fills = matchOrder(market, taker);

    expect(fills).toHaveLength(0);
    expect(market.bids).toHaveLength(1); // Resting limit
    expect(market.bids[0].price).toBe(99);
  });

  it('updates open interest on fills', () => {
    expect(market.openInterest).toBe(0);

    const taker = makeOrder({
      id: 205, trader: 'taker-6', side: Side.Long, orderType: OrderType.Market,
      price: 0, size: 3, timestamp: 10,
    });

    matchOrder(market, taker);

    expect(market.openInterest).toBe(3);
  });

  it('fills sell limit order against bids', () => {
    // Add bids
    insertOrderIntoBook(market, makeOrder({
      id: 300, trader: 'buyer-A', side: Side.Long, price: 99, size: 10, timestamp: 1,
    }));

    const taker = makeOrder({
      id: 301, trader: 'seller-1', side: Side.Short, orderType: OrderType.Limit,
      price: 98, size: 5, timestamp: 10,
    });

    const fills = matchOrder(market, taker);

    expect(fills).toHaveLength(1);
    expect(fills[0].price).toBe(99); // Maker price
    expect(fills[0].size).toBe(5);
    expect(fills[0].side).toBe(Side.Short);
  });
});

describe('cancelOrder', () => {
  it('removes an order from the book', () => {
    const market = createMarket('SOL-PERP', 'SOL', 'USD');
    insertOrderIntoBook(market, makeOrder({ id: 1, side: Side.Long, price: 100 }));
    insertOrderIntoBook(market, makeOrder({ id: 2, side: Side.Long, price: 99 }));

    const removed = cancelOrder(market, 1, Side.Long);

    expect(removed).not.toBeNull();
    expect(removed!.id).toBe(1);
    expect(market.bids).toHaveLength(1);
    expect(market.bestBid).toBe(99);
  });

  it('returns null for non-existent order', () => {
    const market = createMarket('SOL-PERP', 'SOL', 'USD');
    const removed = cancelOrder(market, 999, Side.Long);
    expect(removed).toBeNull();
  });
});

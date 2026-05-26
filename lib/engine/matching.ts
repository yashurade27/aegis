// ============================================================================
// Aegis Vault — Order Matching Engine
// Implements price-time priority matching with partial fills.
// ============================================================================

import {
  type Market,
  type Order,
  type Fill,
  type Position,
  type TraderAccount,
  Side,
  OrderType,
  BPS_DENOMINATOR,
} from './types';

/**
 * Calculate the fee for a fill.
 * fee = fillSize * fillPrice * feeBps / 10000
 */
export function calculateFee(
  fillSize: number,
  fillPrice: number,
  feeBps: number
): number {
  return (fillSize * fillPrice * feeBps) / BPS_DENOMINATOR;
}

/**
 * Insert an order into the book at the correct position (price-time priority).
 * Bids: descending by price, then ascending by timestamp.
 * Asks: ascending by price, then ascending by timestamp.
 */
export function insertOrderIntoBook(market: Market, order: Order): void {
  const book = order.side === Side.Long ? market.bids : market.asks;

  let insertIdx = book.length;
  for (let i = 0; i < book.length; i++) {
    if (order.side === Side.Long) {
      // Bids: higher price first; ties broken by earlier timestamp
      if (
        order.price > book[i].price ||
        (order.price === book[i].price && order.timestamp < book[i].timestamp)
      ) {
        insertIdx = i;
        break;
      }
    } else {
      // Asks: lower price first; ties broken by earlier timestamp
      if (
        order.price < book[i].price ||
        (order.price === book[i].price && order.timestamp < book[i].timestamp)
      ) {
        insertIdx = i;
        break;
      }
    }
  }

  book.splice(insertIdx, 0, order);
  updateBestPrices(market);
}

/**
 * Update the best bid/ask on a market from the current book.
 */
export function updateBestPrices(market: Market): void {
  market.bestBid = market.bids.length > 0 ? market.bids[0].price : 0;
  market.bestAsk = market.asks.length > 0 ? market.asks[0].price : Infinity;
}

/**
 * Match an incoming taker order against the book.
 * Returns a list of fills. If the order is partially filled and is a limit,
 * the remainder is inserted into the book as a resting order.
 * Market orders that can't be fully filled throw an error.
 */
export function matchOrder(market: Market, takerOrder: Order): Fill[] {
  const fills: Fill[] = [];
  const oppositeBook =
    takerOrder.side === Side.Long ? market.asks : market.bids;

  while (takerOrder.size > 0 && oppositeBook.length > 0) {
    const bestResting = oppositeBook[0];

    // Price check: for limit orders, ensure price is acceptable
    if (takerOrder.orderType === OrderType.Limit) {
      if (
        takerOrder.side === Side.Long &&
        takerOrder.price < bestResting.price
      ) {
        break; // Taker buy price too low
      }
      if (
        takerOrder.side === Side.Short &&
        takerOrder.price > bestResting.price
      ) {
        break; // Taker sell price too high
      }
    }

    // Determine fill size and price
    const fillSize = Math.min(takerOrder.size, bestResting.size);
    const fillPrice = bestResting.price; // Maker price wins

    const fee = calculateFee(fillSize, fillPrice, market.feeBps);

    fills.push({
      maker: bestResting.trader,
      taker: takerOrder.trader,
      price: fillPrice,
      size: fillSize,
      fee,
      side: takerOrder.side,
    });

    // Update sizes
    takerOrder.size -= fillSize;
    bestResting.size -= fillSize;

    // Update open interest
    market.openInterest += fillSize;

    // Remove fully filled resting order
    if (bestResting.size <= 0) {
      oppositeBook.shift();
    }
  }

  // If market order wasn't fully filled, throw error
  if (takerOrder.orderType === OrderType.Market && takerOrder.size > 0) {
    // Revert fills (in a real system we'd be transactional)
    throw new Error('InsufficientLiquidity');
  }

  // If limit order has remaining size, insert into book
  if (takerOrder.orderType === OrderType.Limit && takerOrder.size > 0) {
    insertOrderIntoBook(market, takerOrder);
  }

  updateBestPrices(market);
  return fills;
}

/**
 * Remove an order from the book by ID.
 * Returns the removed order or null if not found.
 */
export function cancelOrder(
  market: Market,
  orderId: number,
  side: Side
): Order | null {
  const book = side === Side.Long ? market.bids : market.asks;
  const idx = book.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;

  const [removed] = book.splice(idx, 1);
  updateBestPrices(market);
  return removed;
}

/**
 * Apply a fill to open/update positions for both maker and taker.
 */
export function applyFillToPositions(
  fill: Fill,
  makerAccount: TraderAccount,
  takerAccount: TraderAccount
): void {
  const makerSide = fill.side === Side.Long ? Side.Short : Side.Long;

  updatePosition(takerAccount, fill.side, fill.price, fill.size, 'market-1');
  updatePosition(makerAccount, makerSide, fill.price, fill.size, 'market-1');
}

/**
 * Update or create a position for a trader.
 */
function updatePosition(
  account: TraderAccount,
  side: Side,
  price: number,
  size: number,
  marketAddr: string
): void {
  const existing = account.positions.find(
    (p) => p.market === marketAddr && p.side === side
  );

  if (existing) {
    // Average in: weighted average entry price
    const totalSize = existing.size + size;
    existing.entryPrice =
      (existing.entryPrice * existing.size + price * size) / totalSize;
    existing.size = totalSize;
  } else {
    account.positions.push({
      market: marketAddr,
      side,
      size,
      entryPrice: price,
      marginAllocated: 0,
      unrealizedPnl: 0,
    });
  }
}

/**
 * Create a default empty market.
 */
export function createMarket(
  address: string,
  baseAsset: string,
  quoteAsset: string,
  feeBps: number = 10,
  insuranceFundCutBps: number = 8000
): Market {
  return {
    address,
    baseAsset,
    quoteAsset,
    bids: [],
    asks: [],
    bestBid: 0,
    bestAsk: Infinity,
    openInterest: 0,
    markPrice: 0,
    indexPrice: 0,
    feeBps,
    insuranceFundCutBps,
  };
}

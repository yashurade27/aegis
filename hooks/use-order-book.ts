'use client';

// ============================================================================
// Hook: useOrderBook
// Provides typed bids and asks derived from the MarketStore.
// ============================================================================

import { useMemo } from 'react';
import { useMarketStore } from '@/lib/store/market-store';
import { type Order } from '@/lib/engine';

export interface OrderBookEntry {
  price: number;
  size: number;
  total: number; // cumulative
  trader: string;
}

function buildBookSide(orders: Order[]): OrderBookEntry[] {
  let cumulative = 0;
  return orders.map((o) => {
    cumulative += o.size;
    return {
      price: o.price,
      size: o.size,
      total: cumulative,
      trader: o.trader,
    };
  });
}

export function useOrderBook(address?: string) {
  const { state } = useMarketStore();
  const { market } = state;

  const bids = useMemo(() => buildBookSide(market.bids), [market.bids]);
  const asks = useMemo(() => buildBookSide(market.asks), [market.asks]);
  const spread = useMemo(
    () =>
      market.bestAsk !== Infinity && market.bestBid > 0
        ? Number((market.bestAsk - market.bestBid).toFixed(2))
        : 0,
    [market.bestBid, market.bestAsk]
  );

  return { bids, asks, spread, bestBid: market.bestBid, bestAsk: market.bestAsk };
}

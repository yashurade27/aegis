'use client';

// ============================================================================
// MarketSimulator
// Drives the local "dummy market" so the demo feels live: a gentle random walk
// on the mark/index price plus periodic order-book jitter. Position PnL updates
// because the new mark price is mirrored into the trader store.
//
// Disabled automatically when the app is running in on-chain mode, where prices
// come from the Pyth-backed mark-price keeper instead.
// ============================================================================

import { useEffect, useRef } from 'react';
import { useMarketStore } from '@/lib/store/market-store';
import { useTraderStore } from '@/lib/store/trader-store';
import { DEFAULT_MARKET_SYMBOL, USE_ONCHAIN } from '@/lib/solana/constants';

const PRICE_TICK_MS = 1500;
const BOOK_TICK_MS = 3000;

export function MarketSimulator() {
  const { state, updatePrices, jitterBook } = useMarketStore();
  const { updateMarkPrice } = useTraderStore();

  // Keep the latest mark price in a ref so the interval always walks from the
  // newest value instead of the one captured when the effect first ran.
  const markRef = useRef(state.market.markPrice);
  markRef.current = state.market.markPrice;

  useEffect(() => {
    if (USE_ONCHAIN) return;

    const priceTimer = setInterval(() => {
      const prevMark = markRef.current || 142.5;
      // Random walk: ±0.25% per tick.
      const drift = (Math.random() - 0.5) * 0.005;
      const nextMark = Math.max(1, prevMark * (1 + drift));
      // Index trails the mark with a small offset so funding stays non-trivial.
      const nextIndex = nextMark * (1 - (Math.random() - 0.5) * 0.0015);

      updatePrices(Number(nextMark.toFixed(2)), Number(nextIndex.toFixed(2)));
      updateMarkPrice(DEFAULT_MARKET_SYMBOL, Number(nextMark.toFixed(2)));
    }, PRICE_TICK_MS);

    const bookTimer = setInterval(() => jitterBook(), BOOK_TICK_MS);

    return () => {
      clearInterval(priceTimer);
      clearInterval(bookTimer);
    };
  }, [updatePrices, updateMarkPrice, jitterBook]);

  return null;
}

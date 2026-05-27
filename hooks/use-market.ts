'use client';

// ============================================================================
// Hook: useMarket
// Returns market state (mark price, open interest, funding rate, error).
// ============================================================================

import { useMemo } from 'react';
import { useMarketStore } from '@/lib/store/market-store';
import { computeFundingRate } from '@/engine/pkg/engine';

export function useMarket(address?: string) {
  const { state } = useMarketStore();
  const { market, error } = state;

  const fundingRate = useMemo(
    () => computeFundingRate(market.markPrice, market.indexPrice),
    [market.markPrice, market.indexPrice]
  );

  return {
    market: address && address !== market.address ? null : market,
    markPrice: market.markPrice,
    indexPrice: market.indexPrice,
    openInterest: market.openInterest,
    fundingRate,
    loading: false,
    error,
  };
}

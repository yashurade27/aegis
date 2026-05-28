'use client';

// ============================================================================
// Hook: useMarket
// Returns market state (mark price, open interest, funding rate, error).
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useMarketStore } from '@/lib/store/market-store';
import { computeFundingRate } from '@/engine/pkg/engine';
import { useSolanaContext } from '@/lib/solana/solana-context';
import { DEFAULT_MARKET_SYMBOL } from '@/lib/solana/constants';
import { marketPda } from '@/lib/solana/pdas';
import { fromBaseUnits, fromPriceUnits } from '@/lib/solana/conversions';
import { type Market } from '@/lib/types';

const REFRESH_MS = 4000;

export function useMarket(address?: string) {
  const { state } = useMarketStore();
  const { market: fallbackMarket, error: fallbackError } = state;
  const solana = useSolanaContext();
  const [onchainMarket, setOnchainMarket] = useState<Market | null>(null);
  const [onchainError, setOnchainError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const useOnchain = Boolean(solana?.program && solana.wallet?.publicKey);

  useEffect(() => {
    if (!useOnchain || !solana?.program) {
      setOnchainMarket(null);
      setOnchainError(null);
      setLoading(false);
      return;
    }

    let active = true;

    const fetchMarket = async () => {
      setLoading(true);
      try {
        const [marketKey] = marketPda(DEFAULT_MARKET_SYMBOL);
        const account = await solana.program.account.market.fetchNullable(marketKey);
        if (!active) return;
        if (!account) {
          setOnchainMarket(null);
          setOnchainError('Market not found on-chain');
          return;
        }

        const mapped: Market = {
          address: marketKey.toBase58(),
          baseAsset: account.baseAsset,
          quoteAsset: account.quoteAsset,
          bids: [],
          asks: [],
          bestBid: 0,
          bestAsk: 0,
          openInterest: fromBaseUnits(account.openInterest),
          markPrice: fromPriceUnits(account.markPrice),
          indexPrice: fromPriceUnits(account.indexPrice),
          feeBps: account.feeBps,
          insuranceFundCutBps: account.insuranceFundCutBps,
        };

        setOnchainMarket(mapped);
        setOnchainError(null);
      } catch (err) {
        if (!active) return;
        setOnchainError((err as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchMarket();
    const timer = setInterval(fetchMarket, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [solana?.program, useOnchain]);

  const market = onchainMarket ?? fallbackMarket;

  const fundingRate = useMemo(() => {
    if (market.indexPrice <= 0) return 0;
    return computeFundingRate(market.markPrice, market.indexPrice);
  }, [market.markPrice, market.indexPrice]);

  return {
    market: address && address !== market.address ? null : market,
    markPrice: market.markPrice,
    indexPrice: market.indexPrice,
    openInterest: market.openInterest,
    fundingRate,
    loading: useOnchain ? loading : false,
    error: useOnchain ? onchainError : fallbackError,
  };
}

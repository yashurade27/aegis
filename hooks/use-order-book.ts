'use client';

// ============================================================================
// Hook: useOrderBook
// Provides typed bids and asks derived from the MarketStore.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useMarketStore } from '@/lib/store/market-store';
import { useSolanaContext } from '@/lib/solana/solana-context';
import { DEFAULT_MARKET_SYMBOL, USE_ONCHAIN } from '@/lib/solana/constants';
import { marketPda } from '@/lib/solana/pdas';
import { decodeOrderType, decodeSide } from '@/lib/solana/anchor-utils';
import { fromBaseUnits, fromPriceUnits } from '@/lib/solana/conversions';
import { type Order, Side } from '@/lib/types';
import { PublicKey } from '@solana/web3.js';

const REFRESH_MS = 4000;

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
  const solana = useSolanaContext();
  const [onchainBids, setOnchainBids] = useState<Order[]>([]);
  const [onchainAsks, setOnchainAsks] = useState<Order[]>([]);
  const [bestBid, setBestBid] = useState(0);
  const [bestAsk, setBestAsk] = useState(0);

  const useOnchain = USE_ONCHAIN && Boolean(solana?.program && solana.wallet?.publicKey);

  useEffect(() => {
    if (!useOnchain || !solana?.program) {
      setOnchainBids([]);
      setOnchainAsks([]);
      setBestBid(0);
      setBestAsk(0);
      return;
    }

    let active = true;

    const getAccountField = (account: Record<string, unknown>, keys: string[]) => {
      for (const key of keys) {
        if (account[key] !== undefined) return account[key];
      }
      return undefined;
    };

    const toNumber = (value: unknown) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'bigint') return Number(value);
      if (value && typeof value === 'object' && 'toNumber' in value) {
        return (value as { toNumber: () => number }).toNumber();
      }
      return Number(value ?? 0);
    };

    const fetchOrders = async () => {
      try {
        if (!solana.program) return;
        const [marketKey] = marketPda(DEFAULT_MARKET_SYMBOL);
        const orders = await solana.program.account.order.all([
          {
            memcmp: {
              offset: 8,
              bytes: marketKey.toBase58(),
            },
          },
        ]);

        if (!active) return;

        const mapped: Order[] = orders
          .map(({ account, publicKey }: { account: any, publicKey: PublicKey }) => {
            const side = decodeSide(account.side);
            const orderType = decodeOrderType(
              getAccountField(account as Record<string, unknown>, ['orderType', 'order_type'])
            );
            const sizeValue = getAccountField(account as Record<string, unknown>, ['size']) ?? 0;
            const priceValue = getAccountField(account as Record<string, unknown>, ['price']) ?? 0;
            const size = fromBaseUnits(sizeValue as never);
            const price = fromPriceUnits(priceValue as never);
            const orderId = toNumber(
              getAccountField(account as Record<string, unknown>, ['orderId', 'order_id'])
            );
            const timestamp = toNumber(
              getAccountField(account as Record<string, unknown>, ['timestamp'])
            );

            return {
              id: orderId,
              trader: account.trader.toBase58(),
              side,
              orderType,
              price,
              size,
              timestamp: timestamp * 1000,
            } as Order;
          })
          .filter((order) => order.size > 0);

        const bids = mapped
          .filter((order) => order.side === Side.Long)
          .sort((a, b) => b.price - a.price);
        const asks = mapped
          .filter((order) => order.side === Side.Short)
          .sort((a, b) => a.price - b.price);

        setOnchainBids(bids);
        setOnchainAsks(asks);
        setBestBid(bids.length > 0 ? bids[0]!.price : 0);
        setBestAsk(asks.length > 0 ? asks[0]!.price : 0);
      } catch (err) {
        if (!active) return;
        setOnchainBids([]);
        setOnchainAsks([]);
        setBestBid(0);
        setBestAsk(0);
      }
    };

    fetchOrders();
    const timer = setInterval(fetchOrders, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [solana?.program, useOnchain]);

  const bids = useMemo(
    () => buildBookSide(useOnchain ? onchainBids : market.bids),
    [market.bids, onchainBids, useOnchain]
  );
  const asks = useMemo(
    () => buildBookSide(useOnchain ? onchainAsks : market.asks),
    [market.asks, onchainAsks, useOnchain]
  );

  const resolvedBestBid = useOnchain ? bestBid : market.bestBid;
  const resolvedBestAsk = useOnchain ? bestAsk : market.bestAsk;
  const spread = useMemo(
    () =>
      resolvedBestAsk !== Infinity && resolvedBestBid > 0
        ? Number((resolvedBestAsk - resolvedBestBid).toFixed(2))
        : 0,
    [resolvedBestAsk, resolvedBestBid]
  );

  return {
    bids,
    asks,
    spread,
    bestBid: resolvedBestBid,
    bestAsk: resolvedBestAsk,
  };
}

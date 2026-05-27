'use client';

import { useMemo } from 'react';
import { useOrderBook } from '@/hooks/use-order-book';
import { cn } from '@/lib/utils';

interface OrderBookProps {
  address?: string;
  depth?: number;
  className?: string;
}

function formatPrice(price: number): string {
  return price.toFixed(2);
}

function formatSize(size: number): string {
  return size.toFixed(2);
}

export function OrderBook({ address, depth = 8, className }: OrderBookProps) {
  const { bids, asks, spread, bestBid, bestAsk } = useOrderBook(address);

  const maxTotal = useMemo(() => {
    const bidMax = bids.length > 0 ? bids[bids.length - 1]!.total : 0;
    const askMax = asks.length > 0 ? asks[asks.length - 1]!.total : 0;
    return Math.max(bidMax, askMax, 1);
  }, [bids, asks]);

  const visibleAsks = useMemo(
    () => [...asks].slice(0, depth).reverse(),
    [asks, depth]
  );
  const visibleBids = useMemo(() => bids.slice(0, depth), [bids, depth]);

  return (
    <div className={cn('flex flex-col bg-surface-container-lowest border border-grid-line', className)}>
      <div className="flex items-center justify-between border-b border-grid-line px-4 py-3">
        <span className="font-label-mono text-label-mono text-xs text-on-surface-variant uppercase">
          [ ORDER_BOOK ]
        </span>
        <span className="font-label-mono text-xs text-terminal-gray">
          SPREAD: ${spread.toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 py-2 border-b border-grid-line font-label-mono text-xs text-terminal-gray uppercase">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        {/* Asks — best ask nearest the spread (bottom of ask section) */}
        <div className="flex flex-col flex-1">
          {visibleAsks.map((entry) => (
            <div
              key={`ask-${entry.price}-${entry.trader}`}
              className="relative grid grid-cols-3 gap-2 px-4 py-1 font-label-mono text-xs"
            >
              <div
                className="absolute inset-y-0 right-0 bg-red-500/10 transition-all"
                style={{ width: `${(entry.total / maxTotal) * 100}%` }}
              />
              <span className="relative text-red-400">{formatPrice(entry.price)}</span>
              <span className="relative text-right text-on-surface">{formatSize(entry.size)}</span>
              <span className="relative text-right text-terminal-gray">{formatSize(entry.total)}</span>
            </div>
          ))}
        </div>

        {/* Spread row */}
        <div className="grid grid-cols-3 gap-2 px-4 py-2 border-y border-grid-line bg-background font-label-mono text-xs">
          <span className="text-[#00FF41]">{bestAsk > 0 && bestAsk !== Infinity ? formatPrice(bestAsk) : '—'}</span>
          <span className="text-center text-vault-blue col-span-2">
            ${spread.toFixed(2)} spread
          </span>
        </div>

        {/* Bids — best bid at top */}
        <div className="flex flex-col flex-1">
          {visibleBids.map((entry) => (
            <div
              key={`bid-${entry.price}-${entry.trader}`}
              className="relative grid grid-cols-3 gap-2 px-4 py-1 font-label-mono text-xs"
            >
              <div
                className="absolute inset-y-0 right-0 bg-[#00FF41]/10 transition-all"
                style={{ width: `${(entry.total / maxTotal) * 100}%` }}
              />
              <span className="relative text-[#00FF41]">{formatPrice(entry.price)}</span>
              <span className="relative text-right text-on-surface">{formatSize(entry.size)}</span>
              <span className="relative text-right text-terminal-gray">{formatSize(entry.total)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-grid-line px-4 py-2 font-label-mono text-xs text-terminal-gray flex justify-between">
        <span>BID: ${bestBid > 0 ? formatPrice(bestBid) : '—'}</span>
        <span>ASK: ${bestAsk > 0 && bestAsk !== Infinity ? formatPrice(bestAsk) : '—'}</span>
      </div>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { useMarket } from '@/hooks/use-market';
import { MAX_FUNDING_RATE_BPS, BPS_DENOMINATOR } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FundingRateBarProps {
  address?: string;
  className?: string;
}

export function FundingRateBar({ address, className }: FundingRateBarProps) {
  const { fundingRate, markPrice, indexPrice } = useMarket(address);

  const ratePct = useMemo(
    () => (fundingRate / BPS_DENOMINATOR) * 100,
    [fundingRate]
  );

  const barPosition = useMemo(() => {
    const clamped = Math.max(-MAX_FUNDING_RATE_BPS, Math.min(MAX_FUNDING_RATE_BPS, fundingRate));
    return 50 + (clamped / MAX_FUNDING_RATE_BPS) * 50;
  }, [fundingRate]);

  const isLongPays = fundingRate > 0;

  const projectedHourly = useMemo(() => {
    const notional = 10000;
    return (notional * fundingRate) / BPS_DENOMINATOR;
  }, [fundingRate]);

  return (
    <div className={cn('flex flex-col gap-3 bg-surface-container-lowest border border-grid-line p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="font-label-mono text-label-mono text-xs text-on-surface-variant uppercase">
          [ FUNDING_RATE ]
        </span>
        <span
          className={cn(
            'font-label-mono text-xs',
            fundingRate > 0 ? 'text-red-400' : fundingRate < 0 ? 'text-[#00FF41]' : 'text-terminal-gray'
          )}
        >
          {fundingRate > 0 ? '+' : ''}{ratePct.toFixed(4)}% / hr
        </span>
      </div>

      {/* Bar visualization: center = 0, left = negative, right = positive */}
      <div className="relative h-4 bg-grid-line">
        <div className="absolute inset-y-0 left-1/2 w-px bg-on-surface-variant/30" />
        <div
          className={cn(
            'absolute inset-y-0 transition-all duration-300',
            fundingRate >= 0 ? 'bg-red-500/60 left-1/2' : 'bg-[#00FF41]/60 right-1/2'
          )}
          style={
            fundingRate >= 0
              ? { width: `${barPosition - 50}%`, left: '50%' }
              : { width: `${50 - barPosition}%`, right: '50%' }
          }
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary border border-background"
          style={{ left: `calc(${barPosition}% - 4px)` }}
        />
      </div>

      <div className="flex justify-between font-label-mono text-xs text-terminal-gray">
        <span>-{MAX_FUNDING_RATE_BPS} bps</span>
        <span>0</span>
        <span>+{MAX_FUNDING_RATE_BPS} bps</span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-grid-line font-label-mono text-xs">
        <div className="bg-background p-2 flex flex-col gap-1">
          <span className="text-terminal-gray uppercase">Mark / Index</span>
          <span className="text-on-surface">
            ${markPrice.toFixed(2)} / ${indexPrice.toFixed(2)}
          </span>
        </div>
        <div className="bg-background p-2 flex flex-col gap-1">
          <span className="text-terminal-gray uppercase">$10k Projection</span>
          <span className={isLongPays ? 'text-red-400' : 'text-[#00FF41]'}>
            {projectedHourly >= 0 ? '+' : ''}${projectedHourly.toFixed(2)}/hr
          </span>
        </div>
      </div>

      <p className="font-label-mono text-xs text-terminal-gray">
        {isLongPays ? 'Longs pay shorts' : fundingRate < 0 ? 'Shorts pay longs' : 'Neutral funding'}
      </p>
    </div>
  );
}

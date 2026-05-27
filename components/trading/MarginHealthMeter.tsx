'use client';

import { cn } from '@/lib/utils';
import { BPS_DENOMINATOR } from '@/lib/types';

interface MarginHealthMeterProps {
  healthBps: number;
  healthPct?: number;
  className?: string;
}

function getHealthStatus(healthBps: number): {
  label: string;
  color: string;
  barColor: string;
} {
  if (healthBps > 2000) {
    return { label: 'HEALTHY', color: 'text-[#00FF41]', barColor: 'bg-[#00FF41]' };
  }
  if (healthBps > 500) {
    return { label: 'CAUTION', color: 'text-secondary', barColor: 'bg-secondary' };
  }
  return { label: 'AT RISK', color: 'text-red-400', barColor: 'bg-red-500' };
}

export function MarginHealthMeter({ healthBps, healthPct, className }: MarginHealthMeterProps) {
  const pct = healthPct ?? Math.min(100, Math.max(0, (healthBps / BPS_DENOMINATOR) * 100));
  const status = getHealthStatus(healthBps);

  return (
    <div className={cn('flex flex-col gap-3 bg-surface-container-lowest border border-grid-line p-4', className)}>
      <div className="flex items-center justify-between">
        <span className="font-label-mono text-label-mono text-xs text-on-surface-variant uppercase">
          [ MARGIN_HEALTH ]
        </span>
        <span className={cn('font-label-mono text-xs uppercase', status.color)}>
          {status.label}
        </span>
      </div>

      <div className="relative h-3 w-full bg-grid-line overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', status.barColor)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Margin health"
        />
      </div>

      <div className="flex justify-between font-label-mono text-xs">
        <span className="text-terminal-gray">{healthBps.toFixed(0)} bps</span>
        <span className={status.color}>{pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

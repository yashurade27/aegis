'use client';

import { useMemo } from 'react';
import { useTraderAccount } from '@/hooks/use-trader-account';
import { useTraderStore } from '@/lib/store/trader-store';
import { calculateUnrealizedPnl, liquidationPrice } from '@/engine/pkg/engine';
import { Side, DEFAULT_MAINTENANCE_MARGIN_BPS, type Position } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PositionTableProps {
  defaultLeverage?: number;
  className?: string;
}

function formatUsd(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PositionRow({
  position,
  markPrice,
  leverage,
}: {
  position: Position;
  markPrice: number;
  leverage: number;
}) {
  const pnl = calculateUnrealizedPnl(position, markPrice);
  const liqPrice = liquidationPrice(
    position.entryPrice,
    position.side,
    DEFAULT_MAINTENANCE_MARGIN_BPS,
    leverage
  );

  return (
    <tr className="border-b border-grid-line hover:bg-surface-container-low/50">
      <td className="px-4 py-3 font-label-mono text-xs">{position.market}</td>
      <td className="px-4 py-3 font-label-mono text-xs">
        <span className={position.side === Side.Long ? 'text-[#00FF41]' : 'text-red-400'}>
          {position.side.toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-3 font-label-mono text-xs text-right">{position.size.toFixed(4)}</td>
      <td className="px-4 py-3 font-label-mono text-xs text-right">${position.entryPrice.toFixed(2)}</td>
      <td className="px-4 py-3 font-label-mono text-xs text-right">${markPrice.toFixed(2)}</td>
      <td
        className={cn(
          'px-4 py-3 font-label-mono text-xs text-right',
          pnl >= 0 ? 'text-[#00FF41]' : 'text-red-400'
        )}
      >
        {formatUsd(pnl)}
      </td>
      <td className="px-4 py-3 font-label-mono text-xs text-right text-secondary">
        ${liqPrice.toFixed(2)}
      </td>
    </tr>
  );
}

export function PositionTable({ defaultLeverage = 5, className }: PositionTableProps) {
  const { positions } = useTraderAccount();
  const { state } = useTraderStore();
  const { markPrices } = state;

  const rows = useMemo(
    () =>
      positions.map((pos) => ({
        position: pos,
        markPrice: markPrices.get(pos.market) ?? pos.entryPrice,
      })),
    [positions, markPrices]
  );

  return (
    <div className={cn('bg-surface-container-lowest border border-grid-line', className)}>
      <div className="border-b border-grid-line px-4 py-3">
        <span className="font-label-mono text-label-mono text-xs text-on-surface-variant uppercase">
          [ OPEN_POSITIONS ]
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-grid-line font-label-mono text-xs text-terminal-gray uppercase">
              <th className="px-4 py-2 text-left">Market</th>
              <th className="px-4 py-2 text-left">Side</th>
              <th className="px-4 py-2 text-right">Size</th>
              <th className="px-4 py-2 text-right">Entry</th>
              <th className="px-4 py-2 text-right">Mark</th>
              <th className="px-4 py-2 text-right">PnL</th>
              <th className="px-4 py-2 text-right">Liq. Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center font-label-mono text-xs text-terminal-gray">
                  No open positions
                </td>
              </tr>
            ) : (
              rows.map(({ position, markPrice }) => (
                <PositionRow
                  key={`${position.market}-${position.side}`}
                  position={position}
                  markPrice={markPrice}
                  leverage={defaultLeverage}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

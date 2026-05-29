'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useMarket } from '@/hooks/use-market';

interface PricePoint {
  time: string;
  timestamp: number;
  price: number;
}

const MAX_POINTS = 100;
const POLL_INTERVAL = 3000;

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as PricePoint;
  return (
    <div className="bg-surface-container-lowest border border-grid-line px-3 py-2 font-label-mono text-xs">
      <div className="text-terminal-gray">{point.time}</div>
      <div className="text-primary text-sm font-semibold">${point.price.toFixed(4)}</div>
    </div>
  );
}

export function PriceChart({ className = '' }: { className?: string }) {
  const { markPrice } = useMarket();
  const [data, setData] = useState<PricePoint[]>([]);
  const priceRef = useRef(markPrice);
  const initialPriceRef = useRef<number | null>(null);

  // Keep the ref in sync
  priceRef.current = markPrice;

  // Track the first price we ever saw
  useEffect(() => {
    if (initialPriceRef.current === null && markPrice > 0) {
      initialPriceRef.current = markPrice;
    }
  }, [markPrice]);

  const pushPoint = useCallback(() => {
    const price = priceRef.current;
    if (price <= 0) return;
    const now = Date.now();
    setData((prev) => {
      const next = [
        ...prev,
        { time: formatTime(now), timestamp: now, price },
      ];
      return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
    });
  }, []);

  // Seed initial point immediately
  useEffect(() => {
    if (markPrice > 0 && data.length === 0) {
      pushPoint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markPrice]);

  // Poll every POLL_INTERVAL
  useEffect(() => {
    const id = setInterval(pushPoint, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [pushPoint]);

  // Derived stats
  const currentPrice = data.length > 0 ? data[data.length - 1].price : markPrice;
  const firstPrice = initialPriceRef.current ?? markPrice;
  const priceDelta = currentPrice - firstPrice;
  const priceDeltaPct = firstPrice > 0 ? (priceDelta / firstPrice) * 100 : 0;
  const isPositive = priceDelta >= 0;

  // Chart domain — give ~0.3% padding on both sides
  const prices = data.map((d) => d.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : markPrice - 1;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : markPrice + 1;
  const padding = Math.max((maxPrice - minPrice) * 0.15, 0.05);

  const lineColor = isPositive ? '#00FF41' : '#FF4136';
  const fillId = 'priceGradient';

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-on-surface-variant font-label-mono text-label-mono text-xs uppercase">
            [ PRICE_CHART ]
          </span>
          <div className="flex items-baseline gap-3">
            <span className="font-headline-lg text-headline-lg">
              ${currentPrice.toFixed(2)}
            </span>
            <span
              className={`font-label-mono text-xs ${isPositive ? 'text-[#00FF41]' : 'text-red-400'}`}
            >
              {isPositive ? '▲' : '▼'} {Math.abs(priceDelta).toFixed(4)} (
              {isPositive ? '+' : ''}
              {priceDeltaPct.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse" />
          <span className="text-terminal-gray font-label-mono text-xs">LIVE</span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="border border-grid-line bg-surface-container-lowest p-2" style={{ height: 280 }}>
        {data.length < 2 ? (
          <div className="w-full h-full flex items-center justify-center text-terminal-gray font-label-mono text-xs animate-pulse">
            LOADING PRICE DATA...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fill: '#6B6B6B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={60}
              />
              <YAxis
                domain={[minPrice - padding, maxPrice + padding]}
                tick={{ fill: '#6B6B6B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                width={72}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={firstPrice}
                stroke="rgba(255,255,255,0.1)"
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={lineColor}
                strokeWidth={2}
                fill={`url(#${fillId})`}
                animationDuration={300}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: lineColor,
                  stroke: '#0D0D0D',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

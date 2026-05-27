'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  requiredInitialMargin,
  liquidationPrice,
  marginHealth,
  calculateUnrealizedPnl,
  computeFundingRate,

} from '@/engine/pkg/engine';
import { Side } from '@/lib/types';

export default function Simulator() {
  const [price, setPrice] = useState(142.5);
  const [leverage, setLeverage] = useState(3.5);
  const [funding, setFunding] = useState(12);
  const [duration, setDuration] = useState(90);
  const [depositAmount, setDepositAmount] = useState(10000);
  const [side, setSide] = useState<Side>(Side.Long);

  // ── Real engine calculations ───────────────────────────────────────────

  const notional = useMemo(() => depositAmount * leverage, [depositAmount, leverage]);

  const initialMargin = useMemo(
    () => requiredInitialMargin(notional, leverage),
    [notional, leverage]
  );

  const liqPrice = useMemo(
    () => liquidationPrice(price, side, 500, leverage),
    [price, side, leverage]
  );

  // Mark price after movement
  const projectedMarkPrice = useMemo(
    () => price * (1 + (funding / 100) * (duration / 365)),
    [price, funding, duration]
  );

  const mockPosition = { market: 'SOL-PERP', side, size: depositAmount / price, entryPrice: price, marginAllocated: initialMargin, unrealizedPnl: 0 };
  const estimatedProfit = useMemo(
    () => calculateUnrealizedPnl(mockPosition, projectedMarkPrice),
    [projectedMarkPrice, mockPosition.size, mockPosition.entryPrice, side]
  );

  const health = useMemo(
    () => marginHealth(initialMargin, estimatedProfit, notional),
    [initialMargin, estimatedProfit, notional]
  );

  // Buffer between liquidation and current price (%)
  const downsideProtection = useMemo(() => {
    if (side === Side.Long) {
      return ((price - liqPrice) / price) * 100;
    }
    return ((liqPrice - price) / price) * 100;
  }, [price, liqPrice, side]);

  const projectedNAV = useMemo(
    () => depositAmount + estimatedProfit,
    [depositAmount, estimatedProfit]
  );

  // Funding rate from engine
  const fundingRate = useMemo(
    () => computeFundingRate(price * (1 + funding / 10000), price),
    [price, funding]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow grid-bg relative">
        <div className="scanline"></div>
        <div className="max-w-[1440px] mx-auto border-x border-grid-line min-h-screen flex flex-col">
          {/* Page Header */}
          <section className="border-b border-grid-line p-margin-md md:p-margin-lg">
            <div className="flex flex-col gap-2">
              <span className="text-vault-blue font-label-mono text-label-mono">[ MODULE: SIM_04 ]</span>
              <h1 className="font-headline-xl text-headline-xl uppercase tracking-tighter">SCENARIO SIMULATOR</h1>
              <p className="text-on-surface-variant font-label-mono text-label-mono uppercase">STRESS-TEST YOUR STRATEGY — POWERED BY REAL ENGINE CALCULATIONS</p>
            </div>
          </section>

          {/* Main Simulation Engine */}
          <div className="flex flex-col lg:flex-row flex-grow border-b border-grid-line">
            {/* Left Panel: Controls */}
            <aside className="w-full lg:w-[400px] border-r border-grid-line p-margin-md flex flex-col gap-8 bg-surface-container-lowest">
              <div className="flex items-center justify-between border-b border-grid-line pb-4">
                <span className="font-label-mono text-label-mono text-terminal-gray uppercase">/ PARAMETERS</span>
              </div>

              {/* Side Toggle */}
              <div className="flex flex-col gap-2">
                <span className="text-on-surface-variant font-label-mono text-label-mono text-xs">[ POSITION_SIDE ]</span>
                <div className="grid grid-cols-2 gap-px bg-grid-line">
                  <button
                    onClick={() => setSide(Side.Long)}
                    className={`py-2 font-label-mono text-label-mono text-xs uppercase transition-colors ${side === Side.Long ? 'bg-[#00FF41] text-black' : 'bg-surface-container-lowest text-on-surface-variant hover:text-primary'}`}
                  >
                    LONG
                  </button>
                  <button
                    onClick={() => setSide(Side.Short)}
                    className={`py-2 font-label-mono text-label-mono text-xs uppercase transition-colors ${side === Side.Short ? 'bg-red-500 text-black' : 'bg-surface-container-lowest text-on-surface-variant hover:text-primary'}`}
                  >
                    SHORT
                  </button>
                </div>
              </div>

              {/* Deposit Amount */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between font-label-mono text-label-mono">
                  <span className="text-on-surface-variant">[ COLLATERAL_USD ]</span>
                  <span className="text-primary">${depositAmount.toLocaleString()}</span>
                </div>
                <input type="range" min="1000" max="100000" step="1000" value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-xs text-terminal-gray font-label-mono">
                  <span>$1K</span><span>$50K</span><span>$100K</span>
                </div>
              </div>

              {/* Price Slider */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between font-label-mono text-label-mono">
                  <span className="text-on-surface-variant">[ SOL_ENTRY_PRICE ]</span>
                  <span className="text-primary">${price.toFixed(2)}</span>
                </div>
                <input type="range" min="10" max="500" step="0.5" value={price}
                  onChange={(e) => setPrice(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-xs text-terminal-gray font-label-mono">
                  <span>$10</span><span>$255</span><span>$500</span>
                </div>
              </div>

              {/* Leverage Slider */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between font-label-mono text-label-mono">
                  <span className="text-on-surface-variant">[ LEVERAGE_FACTOR ]</span>
                  <span className="text-primary">{leverage.toFixed(1)}x</span>
                </div>
                <input type="range" min="1" max="10" step="0.1" value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-xs text-terminal-gray font-label-mono">
                  <span>1.0X</span><span>5.0X</span><span>10.0X</span>
                </div>
              </div>

              {/* Funding Slider */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between font-label-mono text-label-mono">
                  <span className="text-on-surface-variant">[ PRICE_MOVE_PCT ]</span>
                  <span className="text-primary">{funding > 0 ? '+' : ''}{funding}%</span>
                </div>
                <input type="range" min="-100" max="200" value={funding}
                  onChange={(e) => setFunding(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-xs text-terminal-gray font-label-mono">
                  <span>-100%</span><span>0%</span><span>+200%</span>
                </div>
              </div>

              {/* Duration Slider */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between font-label-mono text-label-mono">
                  <span className="text-on-surface-variant">[ TIME_HORIZON_DAYS ]</span>
                  <span className="text-primary">{duration} Days</span>
                </div>
                <input type="range" min="1" max="365" value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-xs text-terminal-gray font-label-mono">
                  <span>1 D</span><span>180 D</span><span>365 D</span>
                </div>
              </div>
            </aside>

            {/* Right Panel: Projection */}
            <section className="flex-grow p-margin-md flex flex-col gap-margin-md overflow-hidden">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-grid-line">
                <div className="bg-background p-margin-sm flex flex-col gap-2">
                  <span className="font-label-mono text-label-mono text-terminal-gray uppercase text-xs">ESTIMATED_PNL</span>
                  <div className="flex items-baseline gap-2">
                    <span className={`font-headline-lg text-headline-lg ${estimatedProfit >= 0 ? 'text-[#00FF41]' : 'text-red-400'}`}>
                      {estimatedProfit >= 0 ? '+' : ''}${estimatedProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="bg-background p-margin-sm flex flex-col gap-2">
                  <span className="font-label-mono text-label-mono text-terminal-gray uppercase text-xs">LIQUIDATION_PRICE</span>
                  <span className="font-headline-lg text-headline-lg text-secondary">${liqPrice.toFixed(2)}</span>
                </div>

                <div className="bg-background p-margin-sm flex flex-col gap-2">
                  <span className="font-label-mono text-label-mono text-terminal-gray uppercase text-xs">DOWNSIDE_BUFFER</span>
                  <span className="font-headline-lg text-headline-lg">{downsideProtection.toFixed(1)}%</span>
                </div>

                <div className="bg-background p-margin-sm flex flex-col gap-2">
                  <span className="font-label-mono text-label-mono text-terminal-gray uppercase text-xs">PROJECTED_NAV</span>
                  <span className="font-headline-lg text-headline-lg">${projectedNAV.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>

              {/* Margin & Position Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-grid-line">
                <div className="bg-surface-container-lowest p-margin-sm flex flex-col gap-1">
                  <span className="font-label-mono text-label-mono text-terminal-gray text-xs">NOTIONAL_SIZE</span>
                  <span className="font-label-mono text-sm">${notional.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="bg-surface-container-lowest p-margin-sm flex flex-col gap-1">
                  <span className="font-label-mono text-label-mono text-terminal-gray text-xs">INITIAL_MARGIN</span>
                  <span className="font-label-mono text-sm">${initialMargin.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-surface-container-lowest p-margin-sm flex flex-col gap-1">
                  <span className="font-label-mono text-label-mono text-terminal-gray text-xs">MARGIN_HEALTH</span>
                  <span className={`font-label-mono text-sm ${health > 2000 ? 'text-[#00FF41]' : health > 500 ? 'text-secondary' : 'text-red-400'}`}>
                    {health.toFixed(0)} bps
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-margin-sm flex flex-col gap-1">
                  <span className="font-label-mono text-label-mono text-terminal-gray text-xs">SOL_POSITION_SIZE</span>
                  <span className="font-label-mono text-sm">{(depositAmount / price).toFixed(4)} SOL</span>
                </div>
              </div>

              {/* Chart Area */}
              <div className="flex-grow border border-grid-line bg-surface-container-lowest relative p-6 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-label-mono text-label-mono text-on-surface-variant uppercase flex items-center gap-2">
                    <span className="w-2 h-2 bg-vault-blue"></span>
                    PROJECTED_EQUITY_CURVE
                  </span>
                  <div className="flex gap-4 font-label-mono text-xs text-terminal-gray">
                    <span>[ SIDE: {side.toUpperCase()} ]</span>
                    <span>[ LEV: {leverage.toFixed(1)}x ]</span>
                  </div>
                </div>

                <div className="flex-grow relative mt-4">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
                    {/* Grid lines */}
                    {[100, 200, 300].map(y => (
                      <line key={y} stroke="#1A1D1F" strokeWidth="1" x1="0" x2="1000" y1={y} y2={y} />
                    ))}
                    {/* Liquidation line */}
                    <line stroke="#EF4444" strokeWidth="1" strokeDasharray="5,5" x1="0" x2="1000" y1="350" y2="350" />
                    <text fill="#EF4444" fontFamily="JetBrains Mono" fontSize="10" x="10" y="345">LIQ: ${liqPrice.toFixed(2)}</text>

                    {/* Projected curve */}
                    {estimatedProfit >= 0 ? (
                      <path d="M0,350 Q250,300 500,200 T1000,50" fill="none" stroke="#0049E6" strokeWidth="2" opacity="0.8" />
                    ) : (
                      <path d="M0,50 Q250,150 500,250 T1000,380" fill="none" stroke="#EF4444" strokeWidth="2" opacity="0.8" />
                    )}

                    {/* Entry point */}
                    <circle cx="0" cy={estimatedProfit >= 0 ? 350 : 50} fill="white" r="4" />
                    <text fill="white" fontFamily="JetBrains Mono" fontSize="12" x="10" y={estimatedProfit >= 0 ? 345 : 65}>
                      ENTRY: ${price.toFixed(2)}
                    </text>
                    {/* Exit point */}
                    <circle cx="1000" cy={estimatedProfit >= 0 ? 50 : 380} fill="#00FF41" r="4" />
                    <text fill="#00FF41" fontFamily="JetBrains Mono" fontSize="12" x="850" y={estimatedProfit >= 0 ? 45 : 375}>
                      ${projectedMarkPrice.toFixed(2)}
                    </text>
                  </svg>
                </div>

                <div className="mt-4 flex justify-between items-center border-t border-grid-line pt-4 font-label-mono text-xs text-terminal-gray">
                  <div className="flex gap-4">
                    <span>ENGINE: MATCHING_V1</span>
                    <span>MAINT_MARGIN: 5.00%</span>
                    <span>FEE: 0.10%</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="bg-vault-blue w-2 h-2 rounded-full animate-pulse"></span>
                    <span className="text-on-surface">LIVE ENGINE STATUS: NOMINAL</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer Logs */}
          <footer className="p-margin-md bg-surface-container-lowest">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-grid-line pb-2">
                <span className="text-vault-blue font-label-mono text-label-mono">[ RISK_PARAMETER_VALIDATION ]</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-label-mono text-xs">
                <div className="flex gap-2 text-on-surface-variant">
                  <span className="text-primary">[ ENGINE ]</span>
                  <span>LEVERAGE_CHECK: {leverage <= 10 ? 'WITHIN_CAP ✓' : 'EXCEEDS_CAP ✗'}</span>
                </div>
                <div className="flex gap-2 text-on-surface-variant">
                  <span className="text-primary">[ ENGINE ]</span>
                  <span>LIQ_BUFFER: {downsideProtection.toFixed(1)}% FROM_ENTRY</span>
                </div>
                <div className="flex gap-2 text-on-surface-variant">
                  <span className="text-primary">[ ENGINE ]</span>
                  <span>INIT_MARGIN: ${initialMargin.toFixed(2)} REQUIRED</span>
                </div>
                <div className="flex gap-2 text-on-surface-variant">
                  <span className="text-primary">[ ENGINE ]</span>
                  <span>STATUS: {health > 500 ? 'HEALTHY ✓' : 'AT_RISK ✗'}</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </main>
      <Footer />
    </div>
  );
}

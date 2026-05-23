'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function Simulator() {
  const [price, setPrice] = useState(142);
  const [leverage, setLeverage] = useState(3.5);
  const [funding, setFunding] = useState(12);
  const [duration, setDuration] = useState(90);

  const updateStats = () => {
    // Simulate profit calculation
    const baseProfit = (price * leverage * (funding / 100) * (duration / 30)) / 100;
    return baseProfit * 100;
  };

  const profit = updateStats();
  const downside = 94.2;
  const nav = 342891;

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
              <p className="text-on-surface-variant font-label-mono text-label-mono uppercase">STRESS-TEST YOUR STRATEGY AGAINST MARKET VOLATILITY</p>
            </div>
          </section>

          {/* Main Simulation Engine */}
          <div className="flex flex-col lg:flex-row flex-grow border-b border-grid-line">
            {/* Left Panel: Controls */}
            <aside className="w-full lg:w-[400px] border-r border-grid-line p-margin-md flex flex-col gap-8 bg-surface-container-lowest">
              <div className="flex items-center justify-between border-b border-grid-line pb-4">
                <span className="font-label-mono text-label-mono text-terminal-gray uppercase">/ PARAMETERS</span>
              </div>

              {/* Price Slider */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between font-label-mono text-label-mono">
                  <span className="text-on-surface-variant">[ SOL_PRICE_USD ]</span>
                  <span className="text-primary">${(price).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-terminal-gray font-label-mono">
                  <span>$0.00</span>
                  <span>$250.00</span>
                  <span>$500.00</span>
                </div>
              </div>

              {/* Leverage Slider */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between font-label-mono text-label-mono">
                  <span className="text-on-surface-variant">[ LEVERAGE_FACTOR ]</span>
                  <span className="text-primary">{leverage.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-terminal-gray font-label-mono">
                  <span>1.0X</span>
                  <span>5.0X</span>
                  <span>10.0X</span>
                </div>
              </div>

              {/* Funding Slider */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between font-label-mono text-label-mono">
                  <span className="text-on-surface-variant">[ FUNDING_RATE_APR ]</span>
                  <span className="text-primary">{funding > 0 ? '+' : ''}{funding}%</span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={funding}
                  onChange={(e) => setFunding(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-terminal-gray font-label-mono">
                  <span>-200%</span>
                  <span>0%</span>
                  <span>+200%</span>
                </div>
              </div>

              {/* Duration Slider */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between font-label-mono text-label-mono">
                  <span className="text-on-surface-variant">[ TIME_HORIZON_DAYS ]</span>
                  <span className="text-primary">{duration} Days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="365"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-terminal-gray font-label-mono">
                  <span>1 D</span>
                  <span>180 D</span>
                  <span>365 D</span>
                </div>
              </div>

              <div className="mt-auto border-t border-grid-line pt-6">
                <button className="w-full py-4 border border-primary text-primary font-label-mono text-label-mono uppercase hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center gap-2">
                  RECALCULATE PROJECTION
                </button>
              </div>
            </aside>

            {/* Right Panel: Projection */}
            <section className="flex-grow p-margin-md flex flex-col gap-margin-md overflow-hidden">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-grid-line">
                <div className="bg-background p-margin-sm flex flex-col gap-4">
                  <span className="font-label-mono text-label-mono text-terminal-gray uppercase">ESTIMATED_PROFIT</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-lg text-headline-lg text-[#00FF41]">${profit.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                    <span className="text-xs font-label-mono text-[#00FF41]">[ +14.2% ]</span>
                  </div>
                </div>
                <div className="bg-background p-margin-sm flex flex-col gap-4">
                  <span className="font-label-mono text-label-mono text-terminal-gray uppercase">DOWNSIDE_PROTECTION</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-lg text-headline-lg">{downside.toFixed(2)}%</span>
                    <div className="w-full h-1 bg-surface-variant relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-vault-blue" style={{ width: `${downside}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="bg-background p-margin-sm flex flex-col gap-4">
                  <span className="font-label-mono text-label-mono text-terminal-gray uppercase">PROJECTED_NAV</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-lg text-headline-lg">${nav.toLocaleString()}</span>
                    <span className="text-terminal-gray text-xs font-label-mono">USD</span>
                  </div>
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
                    <span>[ AXIS_X: DURATION ]</span>
                    <span>[ AXIS_Y: NAV_VALUE ]</span>
                  </div>
                </div>

                <div className="flex-grow relative mt-4">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
                    <line stroke="#1A1D1F" strokeWidth="1" x1="0" x2="1000" y1="100" y2="100"></line>
                    <line stroke="#1A1D1F" strokeWidth="1" x1="0" x2="1000" y1="200" y2="200"></line>
                    <line stroke="#1A1D1F" strokeWidth="1" x1="0" x2="1000" y1="300" y2="300"></line>
                    <path className="opacity-80" d="M0,350 Q250,300 500,200 T1000,50" fill="none" stroke="#0049E6" strokeWidth="2"></path>
                    <path d="M0,350 Q250,300 500,200 T1000,50" fill="none" stroke="white" strokeDasharray="5,5" strokeWidth="1"></path>
                    <circle cx="500" cy="200" fill="white" r="4"></circle>
                    <text fill="white" fontFamily="JetBrains Mono" fontSize="12" x="515" y="195">
                      MID_PT: $284K
                    </text>
                  </svg>
                </div>

                <div className="mt-4 flex justify-between items-center border-t border-grid-line pt-4 font-label-mono text-xs text-terminal-gray">
                  <div className="flex gap-4">
                    <span>SIM_SEED: 0x9A2E...</span>
                    <span>CONFIDENCE_LEVEL: 98.4%</span>
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
                  <span className="text-primary">[ 11:24:02 ]</span>
                  <span>VAL_CHECKSUM_SUCCESS: LEVERAGE WITHIN CAP</span>
                </div>
                <div className="flex gap-2 text-on-surface-variant">
                  <span className="text-primary">[ 11:24:02 ]</span>
                  <span>LIQUIDATION_GAP: &gt;45.0% AT MIDPOINT</span>
                </div>
                <div className="flex gap-2 text-on-surface-variant">
                  <span className="text-primary">[ 11:24:03 ]</span>
                  <span>VOL_ADJUSTMENT: APPLIED (EMA_20)</span>
                </div>
                <div className="flex gap-2 text-on-surface-variant">
                  <span className="text-primary">[ 11:24:03 ]</span>
                  <span>STATUS: READY_FOR_EXECUTION</span>
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

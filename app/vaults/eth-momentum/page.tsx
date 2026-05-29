'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function EthMomentumPage() {
  const [timeRange, setTimeRange] = useState('1d');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow grid-bg relative">
        <div className="scanline"></div>
        <div className="max-w-[1440px] mx-auto border-x border-grid-line min-h-screen flex flex-col">
          {/* Top Stats Bar */}
          <section className="border-b border-grid-line p-margin-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container-lowest">
            <div className="flex gap-8 flex-wrap text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-terminal-gray font-label-mono text-label-mono">CURRENT_NAV</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-lg text-headline-lg">$1.2423</span>
                  <span className="text-vault-blue font-label-mono text-xs">↑ 0.04%</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-terminal-gray font-label-mono text-label-mono">YOUR_POSITION</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-lg text-headline-lg">45.20 ETH</span>
                  <span className="text-terminal-gray font-label-mono text-xs">$112,401.00</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-terminal-gray font-label-mono text-label-mono">TOTAL_PNL</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-lg text-headline-lg text-[#00FF41]">+12.4%</span>
                  <span className="font-label-mono text-xs text-[#00FF41]">+$13,820.00</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-terminal-gray font-label-mono text-label-mono">LENDING_APY</span>
                <span className="font-headline-lg text-headline-lg">6.2%</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-terminal-gray font-label-mono text-label-mono">FUNDING_RATE(1H)</span>
                <span className="font-headline-lg text-headline-lg">0.012%</span>
              </div>
            </div>
            <div className="flex gap-4">
              <Link
                href="/trade"
                className="px-6 py-2 bg-primary text-on-primary font-label-mono text-label-mono uppercase border border-primary hover:opacity-90 transition-opacity"
              >
                TRADE
              </Link>
              <Link
                href="/vault/eth-momentum"
                className="px-6 py-2 text-primary font-label-mono text-label-mono uppercase border border-primary hover:bg-primary hover:text-on-primary transition-colors"
              >
                MANAGE
              </Link>
            </div>
          </section>

          {/* Main Content */}
          <div className="flex-grow border-b border-grid-line flex flex-col lg:flex-row">
            {/* Left: Strategy Info */}
            <section className="flex-grow border-r border-grid-line p-margin-md flex flex-col gap-margin-md overflow-y-auto">
              {/* Strategy Header */}
              <div className="flex items-center justify-between">
                <h1 className="font-headline-xl text-headline-lg uppercase">ETH MOMENTUM</h1>
                <span className="px-3 py-1 border border-vault-blue text-vault-blue font-label-mono text-label-mono">[ STATUS: OPTIMIZED ]</span>
              </div>
              <p className="text-on-surface-variant font-body-md">
                10: 0xETH-04 // PROTOCOL_V5 // ACTIVE_STRATEGY: MOMENTUM_FLIP
              </p>

              {/* Chart Section */}
              <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-label-mono text-label-mono text-on-surface-variant">NAV PERFORMANCE HISTORY</span>
                  <div className="flex gap-2 font-label-mono text-label-mono text-xs">
                    <button
                      onClick={() => setTimeRange('1h')}
                      className={`px-3 py-1 border ${timeRange === '1h' ? 'border-primary text-primary' : 'border-terminal-gray text-terminal-gray'}`}
                    >
                      1H
                    </button>
                    <button
                      onClick={() => setTimeRange('1d')}
                      className={`px-3 py-1 border ${timeRange === '1d' ? 'border-primary text-primary' : 'border-terminal-gray text-terminal-gray'}`}
                    >
                      1D
                    </button>
                    <button
                      onClick={() => setTimeRange('1w')}
                      className={`px-3 py-1 border ${timeRange === '1w' ? 'border-primary text-primary' : 'border-terminal-gray text-terminal-gray'}`}
                    >
                      1W
                    </button>
                    <button
                      onClick={() => setTimeRange('all')}
                      className={`px-3 py-1 border ${timeRange === 'all' ? 'border-primary text-primary' : 'border-terminal-gray text-terminal-gray'}`}
                    >
                      ALL
                    </button>
                  </div>
                </div>

                <div className="relative h-64 w-full">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 250">
                    <defs>
                      <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0049E6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#0049E6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line key={`h-${i}`} stroke="#1A1D1F" strokeWidth="1" x1="0" x2="800" y1={(i * 250) / 4} y2={(i * 250) / 4} />
                    ))}
                    {/* Path */}
                    <path d="M0,200 L50,180 L100,160 L150,140 L200,130 L250,110 L300,100 L350,90 L400,80 L450,70 L500,60 L550,55 L600,50 L650,45 L700,40 L750,35 L800,30" fill="none" stroke="#0049E6" strokeWidth="2" />
                    <path d="M0,200 L50,180 L100,160 L150,140 L200,130 L250,110 L300,100 L350,90 L400,80 L450,70 L500,60 L550,55 L600,50 L650,45 L700,40 L750,35 L800,30" fill="url(#chartGrad)" />
                  </svg>
                </div>

                <div className="mt-4 flex justify-between text-xs text-terminal-gray font-label-mono">
                  <span>00:00 UTC</span>
                  <span>04:00 UTC</span>
                  <span>08:00 UTC</span>
                  <span>12:00 UTC</span>
                  <span>16:00 UTC</span>
                  <span>20:00 UTC</span>
                  <span>NOW</span>
                </div>
              </div>

              {/* Strategy Allocation */}
              <div className="flex gap-8">
                <div className="flex-1 border border-grid-line bg-surface-container-lowest p-6 flex flex-col items-center gap-4">
                  <span className="font-label-mono text-label-mono text-on-surface-variant">STRATEGY_ALLOCATION: CAPITAL_SPLIT</span>
                  <div className="flex items-center justify-center gap-8">
                    <div className="w-40 h-40 rounded-full border-8 border-vault-blue relative">
                      <div className="absolute inset-0 rounded-full border-8 border-surface-container-lowest" style={{ borderRightColor: 'white', clip: 'rect(0px, 200px, 200px, 100px)' }}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-headline-lg text-headline-lg">100%</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-4 h-4 bg-surface-variant"></div>
                        <span className="font-label-mono text-label-mono">STABLE_LENDING</span>
                        <span className="font-label-mono text-label-mono text-terminal-gray">80.00%</span>
                        <span className="font-label-mono text-label-mono text-terminal-gray text-xs">APY: 4.8%</span>
                      </div>
                      <div className="flex gap-3 items-center">
                        <div className="w-4 h-4 bg-vault-blue"></div>
                        <span className="font-label-mono text-label-mono">ETH_PERPS_MOMENTUM</span>
                        <span className="font-label-mono text-label-mono text-terminal-gray">20.00%</span>
                        <span className="font-label-mono text-label-mono text-terminal-gray text-xs">LEV: 3.3x</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Monitor */}
              <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-secondary font-label-mono text-label-mono">LIVE_POSITION_MONITOR</span>
                  <span className="text-terminal-gray font-label-mono text-label-mono text-xs">[ RECORDING... ]</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <span className="text-terminal-gray font-label-mono text-label-mono text-xs">PERF_EXPOSURE</span>
                    <div className="font-headline-lg text-headline-lg">3.2x LONG</div>
                  </div>
                  <div>
                    <span className="text-terminal-gray font-label-mono text-label-mono text-xs">LIQUIDATION_BUFFER</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1 bg-surface-variant rounded-full">
                        <div className="w-8 h-1 bg-primary rounded-full"></div>
                      </div>
                      <span className="font-label-mono text-label-mono">42%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-terminal-gray font-label-mono text-label-mono text-xs">EFFECTIVE_LEVERAGE</span>
                    <div className="font-headline-lg text-headline-lg">2.1x</div>
                  </div>
                  <div>
                    <span className="text-terminal-gray font-label-mono text-label-mono text-xs">UNREALIZED_PNL</span>
                    <div className="font-headline-lg text-headline-lg text-[#00FF41]">+$2,105.19</div>
                  </div>
                </div>

                <div className="border-t border-grid-line pt-4 p-4 bg-surface-dim rounded flex gap-3">
                  <span className="text-secondary font-label-mono text-label-mono text-sm">MARKET_SENTIMENT: BULLISH_ACCELERATION detected. Vault maintaining long bias with dynamic hedge adjustment.</span>
                </div>
              </div>
            </section>

            {/* Right: Event Log */}
            <section className="w-full lg:w-80 border-t lg:border-t-0 border-grid-line bg-surface-container-lowest p-margin-md flex flex-col gap-4 overflow-y-auto">
              <div className="font-label-mono text-label-mono text-on-surface-variant">EVENT_LOG_TERMINAL</div>

              <div className="flex flex-col gap-3 text-xs font-label-mono text-on-surface-variant">
                <div className="p-2 border border-grid-line">
                  <span className="text-primary">• REBALANCED_SOL-PERP_EXPOSURE</span>
                  <div className="text-terminal-gray mt-1">Action: Reduction of exposure to 1.5x due to volatility threshold.</div>
                </div>

                <div className="p-2 border border-grid-line">
                  <span className="text-primary">• HARVESTED_LENDING_YIELD</span>
                  <div className="text-terminal-gray mt-1">Action: $9.50 stake basis compounded into vault.</div>
                </div>

                <div className="p-2 border border-grid-line">
                  <span className="text-primary">• MOMENTUM_FLIP_TRIGGERED</span>
                  <div className="text-terminal-gray mt-1">Action: Signal strength 88/100. Increased long exposure on ETH.</div>
                </div>

                <div className="p-2 border border-grid-line">
                  <span className="text-primary">• DAILY_AUDIT_VERIFIED</span>
                  <div className="text-terminal-gray mt-1">Status: All offsets accounted for in multisig. Zero critical issues.</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

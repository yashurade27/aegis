'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function LandingPage() {
  const [sliderValue, setSliderValue] = useState(0);

  const projectedYield = 12.4 + (sliderValue * 0.15);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow grid-bg relative">
        <div className="scanline"></div>
        <div className="max-w-[1440px] mx-auto border-x border-grid-line min-h-screen flex flex-col">
          {/* HERO SECTION */}
          <section className="border-b border-grid-line p-margin-md md:p-margin-lg flex flex-col lg:flex-row items-center gap-margin-md">
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <span className="text-vault-blue font-label-mono text-label-mono">[ PROTECTED YIELD STRATEGY ]</span>
                <h1 className="font-headline-xl text-headline-xl uppercase tracking-tighter leading-tight">
                  Institutional<br />Grade Yields<br />On Solana
                </h1>
              </div>

              <p className="text-on-surface-variant font-body-md max-w-lg leading-relaxed">
                80% principal protection through lending. 20% alpha engine capturing funding rates and basis trading. Audited. Algorithmic. Decentralized.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/">
                  <button className="px-8 py-3 bg-primary text-on-primary font-label-mono text-label-mono uppercase border border-primary hover:opacity-90 transition-opacity w-full sm:w-auto">
                    LAUNCH APP
                  </button>
                </Link>
                <a href="#how-it-works">
                  <button className="px-8 py-3 text-primary font-label-mono text-label-mono uppercase border border-primary hover:bg-primary hover:text-on-primary transition-colors w-full sm:w-auto">
                    LEARN MORE
                  </button>
                </a>
              </div>

              {/* Key Numbers */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-grid-line">
                <div className="flex flex-col gap-1">
                  <span className="text-terminal-gray font-label-mono text-label-mono text-xs">TOTAL_VALUE</span>
                  <span className="font-headline-lg text-headline-lg">$142.8M</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-terminal-gray font-label-mono text-label-mono text-xs">AVG_APY</span>
                  <span className="font-headline-lg text-headline-lg text-vault-blue">18.5%</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-terminal-gray font-label-mono text-label-mono text-xs">VAULTS_ACTIVE</span>
                  <span className="font-headline-lg text-headline-lg">3</span>
                </div>
              </div>
            </div>

            {/* Animated Visualization */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-full max-w-md h-96 border border-grid-line bg-surface-container-lowest p-8 flex flex-col items-center justify-center gap-8">
                {/* 80/20 Split Visualization */}
                <div className="w-full flex gap-2">
                  <div className="flex-grow bg-surface-variant rounded h-24 flex items-center justify-center border border-grid-line">
                    <div className="text-center">
                      <span className="font-headline-lg text-headline-lg block">80%</span>
                      <span className="text-xs text-terminal-gray font-label-mono">LENDING</span>
                    </div>
                  </div>
                  <div className="w-1/4 bg-vault-blue rounded h-24 flex items-center justify-center animate-pulse">
                    <div className="text-center text-on-primary">
                      <span className="font-headline-lg text-headline-lg block">20%</span>
                      <span className="text-xs font-label-mono">ALPHA</span>
                    </div>
                  </div>
                </div>

                {/* APY Display */}
                <div className="w-full text-center border-t border-grid-line pt-6">
                  <span className="text-terminal-gray font-label-mono text-label-mono text-xs">PROJECTED_APY</span>
                  <div className="font-headline-xl text-headline-xl text-[#00FF41]">18.5%</div>
                </div>

                {/* Chart indicator */}
                <svg className="w-full h-20" preserveAspectRatio="none" viewBox="0 0 300 100">
                  <path d="M0,80 Q75,60 150,40 T300,20" fill="none" stroke="#0049E6" strokeWidth="2" opacity="0.8" />
                  <path d="M0,80 Q75,60 150,40 T300,20" fill="none" stroke="white" strokeDasharray="5,5" strokeWidth="1" />
                </svg>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section id="how-it-works" className="border-b border-grid-line p-margin-md md:p-margin-lg">
            <h2 className="font-headline-lg text-headline-lg uppercase mb-8">HOW IT WORKS</h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { title: 'DEPOSIT', desc: 'You send SOL' },
                { title: 'LENDING', desc: '80% earns yield' },
                { title: 'PERPS', desc: '20% trades basis' },
                { title: 'HARVEST', desc: 'Yield accrued' },
                { title: 'PROTECTION', desc: 'Rebalance auto' },
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col gap-3 p-4 border border-grid-line bg-surface-container-lowest">
                  <span className="text-vault-blue font-label-mono text-label-mono text-xs">{idx + 1}</span>
                  <h3 className="font-label-mono text-label-mono uppercase font-semibold">{step.title}</h3>
                  <p className="text-on-surface-variant text-xs font-body-md">{step.desc}</p>
                  {idx < 4 && <div className="text-vault-blue text-lg">→</div>}
                </div>
              ))}
            </div>
          </section>

          {/* SCENARIO SIMULATOR */}
          <section className="border-b border-grid-line p-margin-md md:p-margin-lg">
            <h2 className="font-headline-lg text-headline-lg uppercase mb-8">SCENARIO SIMULATOR</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-margin-md">
              {/* Slider */}
              <div className="flex flex-col gap-6 border border-grid-line bg-surface-container-lowest p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="font-label-mono text-label-mono">SOL PRICE MOVEMENT</span>
                    <span className="font-headline-lg text-headline-lg">{sliderValue > 0 ? '+' : ''}{sliderValue}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="100"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-terminal-gray font-label-mono">
                    <span>-50%</span>
                    <span>0%</span>
                    <span>+100%</span>
                  </div>
                </div>

                <div className="border-t border-grid-line pt-4 flex flex-col gap-3">
                  <div className="flex justify-between">
                    <span className="text-terminal-gray text-xs">LIQUIDATION_RISK</span>
                    <span className="font-label-mono text-label-mono">{Math.max(0, 100 - (sliderValue * 1.5)).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1 bg-surface-variant rounded">
                    <div
                      className="h-1 bg-vault-blue rounded transition-all"
                      style={{ width: `${Math.max(0, 100 - (sliderValue * 1.5))}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-2">
                  <span className="text-terminal-gray font-label-mono text-label-mono text-xs">PROJECTED_YIELD</span>
                  <span className="font-headline-lg text-headline-lg text-[#00FF41]">${projectedYield.toFixed(2)}</span>
                </div>
                <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-2">
                  <span className="text-terminal-gray font-label-mono text-label-mono text-xs">DOWNSIDE_PROTECTION</span>
                  <span className="font-headline-lg text-headline-lg">94.2%</span>
                </div>
                <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-2">
                  <span className="text-terminal-gray font-label-mono text-label-mono text-xs">PROJECTED_NAV</span>
                  <span className="font-headline-lg text-headline-lg">$342,891</span>
                </div>
                <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-2">
                  <span className="text-terminal-gray font-label-mono text-label-mono text-xs">MAX_DRAWDOWN</span>
                  <span className="font-headline-lg text-headline-lg">-5.8%</span>
                </div>
              </div>
            </div>
          </section>

          {/* VAULT METRICS */}
          <section className="border-b border-grid-line p-margin-md md:p-margin-lg">
            <h2 className="font-headline-lg text-headline-lg uppercase mb-8">VAULT METRICS</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-4">
                <span className="text-terminal-gray font-label-mono text-label-mono text-xs">TVL</span>
                <span className="font-headline-lg text-headline-lg">$142.8M</span>
                <div className="text-xs text-vault-blue font-label-mono">↑ 12.3% this month</div>
              </div>

              <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-4">
                <span className="text-terminal-gray font-label-mono text-label-mono text-xs">CURRENT_NAV</span>
                <span className="font-headline-lg text-headline-lg">$1.2847</span>
                <div className="text-xs text-[#00FF41] font-label-mono">↑ 0.18% today</div>
              </div>

              <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-4">
                <span className="text-terminal-gray font-label-mono text-label-mono text-xs">ACTIVE_POSITIONS</span>
                <span className="font-headline-lg text-headline-lg">412</span>
                <div className="text-xs text-on-surface-variant font-label-mono">across 3 vaults</div>
              </div>

              <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-4">
                <span className="text-terminal-gray font-label-mono text-label-mono text-xs">HISTORICAL_APY</span>
                <span className="font-headline-lg text-headline-lg">18.5%</span>
                <div className="text-xs text-on-surface-variant font-label-mono">30-day average</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-4">
                <span className="text-terminal-gray font-label-mono text-label-mono text-xs">LENDING_YIELD</span>
                <span className="font-headline-lg text-headline-lg">4.8%</span>
                <span className="text-xs text-on-surface-variant font-label-mono">Solend base layer</span>
              </div>

              <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-4">
                <span className="text-terminal-gray font-label-mono text-label-mono text-xs">FUNDING_YIELD</span>
                <span className="font-headline-lg text-headline-lg">13.7%</span>
                <span className="text-xs text-on-surface-variant font-label-mono">perpetual spreads</span>
              </div>
            </div>
          </section>

          {/* STRATEGY EXPLANATION */}
          <section className="border-b border-grid-line p-margin-md md:p-margin-lg">
            <h2 className="font-headline-lg text-headline-lg uppercase mb-8">THE STRATEGY</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-margin-md">
              <div className="flex flex-col gap-6">
                <p className="text-on-surface-variant font-body-md leading-relaxed">
                  Aegis Vaults implement a delta-neutral 80/20 capital split that preserves principal while capturing market inefficiencies through basis trading and funding rate harvesting.
                </p>

                <div className="space-y-4">
                  {[
                    {
                      title: 'PRINCIPAL LAYER (80%)',
                      desc: 'Deployed in audited lending protocols (Solend, Kamino) generating stable 4-5% baseline yield.',
                    },
                    {
                      title: 'ALPHA ENGINE (20%)',
                      desc: 'Captures funding rate spreads and basis trading inefficiencies on Solana perpetuals (Drift, Zeta).',
                    },
                    {
                      title: 'REBALANCING',
                      desc: 'Automated daily rebalancing prevents leverage drift and maintains protection levels.',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="border-l-2 border-vault-blue pl-4">
                      <h3 className="font-label-mono text-label-mono uppercase font-semibold mb-1">{item.title}</h3>
                      <p className="text-on-surface-variant text-sm font-body-md">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-grid-line bg-surface-container-lowest p-8 flex flex-col items-center justify-center">
                <div className="text-center space-y-6 w-full">
                  <span className="text-terminal-gray font-label-mono text-label-mono text-xs">CAPITAL ALLOCATION</span>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded border-2 border-surface-variant flex items-center justify-center">
                        <span className="font-label-mono text-label-mono text-xs">80%</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-label-mono font-semibold">LENDING POOL</div>
                        <div className="text-xs text-on-surface-variant">Solend • Kamino</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded border-2 border-vault-blue flex items-center justify-center bg-vault-blue bg-opacity-20">
                        <span className="font-label-mono text-label-mono text-xs text-vault-blue">20%</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-label-mono font-semibold">PERP TRADES</div>
                        <div className="text-xs text-on-surface-variant">Drift • Zeta</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RISK FRAMEWORK */}
          <section className="border-b border-grid-line p-margin-md md:p-margin-lg">
            <h2 className="font-headline-lg text-headline-lg uppercase mb-8">RISK FRAMEWORK</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-margin-md">
              {[
                {
                  label: 'LOCK PERIOD',
                  value: '7 - 30 Days',
                  desc: 'Prevents panic withdrawals and ensures stable rebalancing',
                },
                {
                  label: 'MAX LEVERAGE',
                  value: '3.5x',
                  desc: 'Hard-capped across all perp positions for safety',
                },
                {
                  label: 'REBALANCING',
                  value: 'Daily',
                  desc: 'Automated rebalancing prevents leverage drift',
                },
                {
                  label: 'PRINCIPAL PROTECTION',
                  value: '94.2%',
                  desc: 'At liquidation threshold with current market conditions',
                },
              ].map((item, idx) => (
                <div key={idx} className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-3">
                  <span className="text-vault-blue font-label-mono text-label-mono text-xs">{item.label}</span>
                  <span className="font-headline-lg text-headline-lg">{item.value}</span>
                  <p className="text-on-surface-variant text-sm font-body-md">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 border border-grid-line bg-surface-dim p-6 rounded flex gap-4">
              <span className="text-secondary text-xl flex-shrink-0">⚠</span>
              <p className="text-on-surface-variant font-body-md">
                All vaults undergo quarterly audits. Smart contracts are audited by Zellic, OtterSec, and Quillst. Zero critical vulnerabilities found.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="border-b border-grid-line p-margin-md md:p-margin-lg flex flex-col items-center justify-center gap-8 text-center">
            <div className="flex flex-col gap-4">
              <h2 className="font-headline-lg text-headline-lg uppercase">START EARNING TODAY</h2>
              <p className="text-on-surface-variant font-body-md max-w-lg mx-auto">
                Join 412 active positions across Aegis Vaults. Deposit SOL, earn institutional-grade yields with algorithmic protection.
              </p>
            </div>

            <Link href="/">
              <button className="px-12 py-4 bg-primary text-on-primary font-label-mono text-label-mono uppercase border border-primary hover:opacity-90 transition-opacity text-lg">
                LAUNCH APP
              </button>
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

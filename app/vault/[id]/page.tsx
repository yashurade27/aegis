'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const vaultData: Record<string, any> = {
  'eth-momentum': {
    name: 'ETH MOMENTUM',
    id: '0xETH-04',
    status: 'OPTIMIZED',
    description: 'Momentum trading strategy for ETH perpetuals with lending base layer',
    nav: '$1.2423',
    navChange: '+0.04%',
    position: '45.20 ETH',
    positionValue: '$112,401.00',
    pnl: '+12.4%',
    pnlValue: '+$13,820.00',
    lendingApy: '6.2%',
    fundingRate: '0.012%',
    perfExposure: '3.2x LONG',
    liquidationBuffer: 42,
    effectiveLeverage: '2.1x',
    unrealizedPnl: '+$2,105.19',
    allocation: [
      { name: 'STABLE_LENDING', value: 80, apy: '4.8%', exchanges: 'Solend • Kamino' },
      { name: 'ETH_PERPS_MOMENTUM', value: 20, lev: '3.3x', exchanges: 'Drift • Zeta' },
    ],
  },
};

export default function VaultDashboard({ params }: { params: { id: string } }) {
  const vault = vaultData['eth-momentum'] || vaultData['eth-momentum'];
  const [timeRange, setTimeRange] = useState('1d');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow grid-bg relative">
        <div className="scanline"></div>
        <div className="max-w-[1440px] mx-auto border-x border-grid-line min-h-screen flex flex-col">
          {/* Top Metrics Bar */}
          <section className="border-b border-grid-line p-margin-md bg-surface-container-lowest">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex gap-12 flex-wrap">
                <div className="flex flex-col gap-1">
                  <span className="text-terminal-gray font-label-mono text-label-mono text-xs">CURRENT_NAV</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-lg text-headline-lg">{vault.nav}</span>
                    <span className="text-vault-blue font-label-mono text-xs">↑ {vault.navChange}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-terminal-gray font-label-mono text-label-mono text-xs">YOUR_POSITION</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-lg text-headline-lg">{vault.position}</span>
                    <span className="text-terminal-gray font-label-mono text-xs">{vault.positionValue}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-terminal-gray font-label-mono text-label-mono text-xs">TOTAL_PNL</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-lg text-headline-lg text-[#00FF41]">{vault.pnl}</span>
                    <span className="font-label-mono text-xs text-[#00FF41]">{vault.pnlValue}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-terminal-gray font-label-mono text-label-mono text-xs">LENDING_APY</span>
                  <span className="font-headline-lg text-headline-lg">{vault.lendingApy}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-terminal-gray font-label-mono text-label-mono text-xs">FUNDING_RATE(1H)</span>
                  <span className="font-headline-lg text-headline-lg">{vault.fundingRate}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="px-6 py-2 bg-primary text-on-primary font-label-mono text-label-mono uppercase border border-primary hover:opacity-90 transition-opacity">
                  DEPOSIT
                </button>
                <button className="px-6 py-2 text-primary font-label-mono text-label-mono uppercase border border-primary hover:bg-primary hover:text-on-primary transition-colors">
                  MANAGE
                </button>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <div className="flex-grow border-b border-grid-line flex flex-col lg:flex-row">
            {/* Left Column */}
            <section className="flex-grow border-r border-grid-line p-margin-md flex flex-col gap-margin-md overflow-y-auto">
              {/* Vault Header */}
              <div className="flex items-center justify-between border-b border-grid-line pb-4">
                <h1 className="font-headline-lg text-headline-lg uppercase">{vault.name}</h1>
                <span className="px-3 py-1 border border-vault-blue text-vault-blue font-label-mono text-label-mono text-xs">
                  [ STATUS: {vault.status} ]
                </span>
              </div>

              {/* NAV Chart */}
              <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-label-mono text-label-mono text-on-surface-variant">NAV PERFORMANCE HISTORY</span>
                  <div className="flex gap-2 font-label-mono text-label-mono text-xs">
                    {['1H', '1D', '1W', 'ALL'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1 border ${
                          timeRange === range ? 'border-primary text-primary' : 'border-terminal-gray text-terminal-gray'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
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
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line key={`h-${i}`} stroke="#1A1D1F" strokeWidth="1" x1="0" x2="800" y1={(i * 250) / 4} y2={(i * 250) / 4} />
                    ))}
                    <path
                      d="M0,200 L50,180 L100,160 L150,140 L200,130 L250,110 L300,100 L350,90 L400,80 L450,70 L500,60 L550,55 L600,50 L650,45 L700,40 L750,35 L800,30"
                      fill="none"
                      stroke="#0049E6"
                      strokeWidth="2"
                    />
                    <path
                      d="M0,200 L50,180 L100,160 L150,140 L200,130 L250,110 L300,100 L350,90 L400,80 L450,70 L500,60 L550,55 L600,50 L650,45 L700,40 L750,35 L800,30"
                      fill="url(#chartGrad)"
                    />
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

              {/* Capital Split */}
              <div className="border border-grid-line bg-surface-container-lowest p-6">
                <span className="font-label-mono text-label-mono text-on-surface-variant block mb-6">CAPITAL SPLIT: 80/20</span>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Pie Chart */}
                  <div className="w-40 h-40 rounded-full border-8 border-vault-blue relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-full flex items-center justify-center">
                      <span className="font-headline-lg text-headline-lg">100%</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex-1 flex flex-col gap-4">
                    {vault.allocation.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className={`w-4 h-4 rounded flex-shrink-0 ${idx === 0 ? 'bg-surface-variant' : 'bg-vault-blue'}`}></div>
                        <div className="flex-1">
                          <div className="font-label-mono text-label-mono text-sm uppercase">{item.name}</div>
                          <div className="text-xs text-on-surface-variant">{item.value}%</div>
                          <div className="text-xs text-terminal-gray">{item.apy || item.lev}</div>
                          <div className="text-xs text-terminal-gray">{item.exchanges}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Position Monitor */}
              <div className="border border-grid-line bg-surface-container-lowest p-6">
                <span className="font-label-mono text-label-mono text-on-surface-variant block mb-6">LIVE_POSITION_MONITOR</span>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <span className="text-terminal-gray font-label-mono text-label-mono text-xs">PERF_EXPOSURE</span>
                    <div className="font-headline-lg text-headline-lg">{vault.perfExposure}</div>
                  </div>

                  <div>
                    <span className="text-terminal-gray font-label-mono text-label-mono text-xs">LIQUIDATION_BUFFER</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-surface-variant rounded-full">
                        <div className="h-1 bg-primary rounded-full" style={{ width: `${vault.liquidationBuffer}%` }}></div>
                      </div>
                      <span className="font-label-mono text-label-mono text-sm">{vault.liquidationBuffer}%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-terminal-gray font-label-mono text-label-mono text-xs">EFFECTIVE_LEVERAGE</span>
                    <div className="font-headline-lg text-headline-lg">{vault.effectiveLeverage}</div>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <span className="text-terminal-gray font-label-mono text-label-mono text-xs">UNREALIZED_PNL</span>
                    <div className="font-headline-lg text-headline-lg text-[#00FF41]">{vault.unrealizedPnl}</div>
                  </div>
                </div>

                <div className="border-t border-grid-line mt-4 pt-4 p-3 bg-surface-dim rounded flex gap-3">
                  <span className="text-secondary text-lg flex-shrink-0">⚡</span>
                  <p className="text-on-surface-variant text-sm font-body-md">
                    Market showing bullish momentum. Vault maintaining long exposure with dynamic hedge for downside protection.
                  </p>
                </div>
              </div>
            </section>

            {/* Right Column - Rebalance Events */}
            <section className="w-full lg:w-80 border-t lg:border-t-0 border-grid-line bg-surface-container-lowest p-margin-md flex flex-col gap-4 overflow-y-auto">
              <div className="font-label-mono text-label-mono text-on-surface-variant">REBALANCE_EVENTS</div>

              <div className="flex flex-col gap-3 text-xs font-label-mono">
                {[
                  {
                    label: 'REBALANCED_ETH-PERP_EXPOSURE',
                    time: '2024-05-23 14:32:18',
                    desc: 'Reduced exposure to 1.5x due to volatility threshold.',
                  },
                  {
                    label: 'HARVESTED_LENDING_YIELD',
                    time: '2024-05-23 09:15:42',
                    desc: '$9.50 worth of rewards compounded into vault.',
                  },
                  {
                    label: 'MOMENTUM_FLIP_TRIGGERED',
                    time: '2024-05-22 18:47:56',
                    desc: 'Signal strength 88/100. Increased long exposure.',
                  },
                  {
                    label: 'DAILY_AUDIT_VERIFIED',
                    time: '2024-05-22 00:05:23',
                    desc: 'All offsets accounted for in multisig.',
                  },
                ].map((event, idx) => (
                  <div key={idx} className="p-3 border border-grid-line bg-surface-container-lowest">
                    <div className="text-primary font-semibold mb-1">• {event.label}</div>
                    <div className="text-terminal-gray mb-1">{event.time}</div>
                    <div className="text-on-surface-variant">{event.desc}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';

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
    splitRatio: '80/20',
    splitPrincipal: 80,
    accent: '#627EEA',
    insight:
      'ETH showing strong bullish momentum. Vault holding a 3.3x long with a dynamic hedge that trims exposure on volatility spikes.',
    allocation: [
      { name: 'STABLE_LENDING', value: 80, apy: '4.8%', exchanges: 'Solend • Kamino' },
      { name: 'ETH_PERPS_MOMENTUM', value: 20, lev: '3.3x', exchanges: 'Drift • Zeta' },
    ],
    events: [
      { label: 'REBALANCED_ETH-PERP_EXPOSURE', time: '2024-05-23 14:32:18', desc: 'Reduced exposure to 1.5x due to volatility threshold.' },
      { label: 'MOMENTUM_FLIP_TRIGGERED', time: '2024-05-22 18:47:56', desc: 'Signal strength 88/100. Increased long exposure.' },
      { label: 'HARVESTED_LENDING_YIELD', time: '2024-05-22 09:15:42', desc: '$9.50 of rewards compounded into vault.' },
      { label: 'DAILY_AUDIT_VERIFIED', time: '2024-05-22 00:05:23', desc: 'All offsets accounted for in multisig.' },
    ],
  },
  'conservative-sql': {
    name: 'CONSERVATIVE SOL',
    id: '0x1-SOL-01',
    status: 'OPTIMIZED',
    description: 'Low-risk lending strategy with downside protection on Solana',
    nav: '$120.45',
    navChange: '+0.02%',
    position: '124.5 SOL',
    positionValue: '$18,485.00',
    pnl: '+6.4%',
    pnlValue: '+$1,130.00',
    lendingApy: '8.4%',
    fundingRate: '0.004%',
    perfExposure: '1.2x LONG',
    liquidationBuffer: 85,
    effectiveLeverage: '1.05x',
    unrealizedPnl: '+$124.50',
    splitRatio: '90/10',
    splitPrincipal: 90,
    accent: '#14F195',
    insight:
      'Capital is parked in blue-chip lending markets earning 8.2%. A small 1.5x SOL hedge offsets downside while keeping leverage near 1x.',
    allocation: [
      { name: 'STABLE_LENDING', value: 90, apy: '8.2%', exchanges: 'Solend • Marginfi' },
      { name: 'SOL_PERPS_HEDGE', value: 10, lev: '1.5x', exchanges: 'Drift' },
    ],
    events: [
      { label: 'COMPOUNDED_SOLEND_INTEREST', time: '2024-05-23 11:02:09', desc: 'Auto-compounded 8.2% APY lending interest.' },
      { label: 'HEDGE_REBALANCED', time: '2024-05-22 22:18:44', desc: 'Trimmed SOL hedge to keep leverage ≈ 1.05x.' },
      { label: 'WITHDRAWAL_BUFFER_TOPPED_UP', time: '2024-05-22 06:40:11', desc: 'Liquidity buffer raised to 12% for 7-day unlocks.' },
      { label: 'DAILY_AUDIT_VERIFIED', time: '2024-05-22 00:05:23', desc: 'Principal protection confirmed at 98%.' },
    ],
  },
  'btc-funding-alpha': {
    name: 'BTC FUNDING ALPHA',
    id: '0x-BTC-09',
    status: 'ACTIVE',
    description: 'Delta-neutral basis trading strategy capturing BTC funding rates',
    nav: '$3,184.22',
    navChange: '+0.08%',
    position: '0.85 BTC',
    positionValue: '$55,200.00',
    pnl: '+18.2%',
    pnlValue: '+$8,750.00',
    lendingApy: '2.1%',
    fundingRate: '0.025%',
    perfExposure: 'NEUTRAL',
    liquidationBuffer: 60,
    effectiveLeverage: '2.4x',
    unrealizedPnl: '+$450.21',
    splitRatio: '50/50',
    splitPrincipal: 50,
    accent: '#F7931A',
    insight:
      'Delta-neutral basis trade: long spot, short perp. Net market exposure ≈ 0 while harvesting a +0.025%/hr funding spread.',
    allocation: [
      { name: 'STABLE_LENDING', value: 50, apy: '2.1%', exchanges: 'Kamino' },
      { name: 'BTC_PERPS_NEUTRAL', value: 50, lev: '2.4x', exchanges: 'Drift • Zeta' },
    ],
    events: [
      { label: 'FUNDING_HARVESTED', time: '2024-05-23 13:00:00', desc: 'Collected +0.025% funding on short perp leg.' },
      { label: 'BASIS_REBALANCED', time: '2024-05-23 01:00:00', desc: 'Re-pegged spot/perp ratio to maintain delta ≈ 0.' },
      { label: 'FUNDING_HARVESTED', time: '2024-05-22 13:00:00', desc: 'Collected +0.021% funding on short perp leg.' },
      { label: 'DAILY_AUDIT_VERIFIED', time: '2024-05-22 00:05:23', desc: 'Delta-neutral invariant verified on-chain.' },
    ],
  }
};

function VaultLiveChart({ baseNav, accent = '#0049E6' }: { baseNav: number; accent?: string }) {
  const [data, setData] = useState<{ time: number; nav: number }[]>([]);

  useEffect(() => {
    // Generate initial history points
    const now = Date.now();
    const history = [];
    let currentNav = baseNav - 0.5; // Starts slightly lower
    for (let i = 20; i >= 0; i--) {
      history.push({
        time: now - i * 3000,
        nav: currentNav,
      });
      currentNav += (Math.random() - 0.4) * 0.05; 
    }
    setData(history);

    const id = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        const next = [...prev, {
          time: Date.now(),
          nav: last.nav + (Math.random() - 0.45) * 0.05,
        }];
        return next.length > 30 ? next.slice(1) : next;
      });
    }, 3000);

    return () => clearInterval(id);
  }, [baseNav]);

  if (data.length === 0) return null;
  const min = Math.min(...data.map(d => d.nav));
  const max = Math.max(...data.map(d => d.nav));
  const pad = (max - min) * 0.1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={0.3} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="nav"
          stroke={accent}
          strokeWidth={2}
          fill="url(#chartGrad)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function VaultDashboard({ params }: { params: { id: string } }) {
  const vault = vaultData[params.id] || vaultData['eth-momentum'];
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
                <Link
                  href={`/deposit?vault=${params.id}`}
                  className="px-6 py-2 bg-primary text-on-primary font-label-mono text-label-mono uppercase border border-primary hover:opacity-90 transition-opacity"
                >
                  DEPOSIT
                </Link>
                <Link
                  href="/trade"
                  className="px-6 py-2 text-primary font-label-mono text-label-mono uppercase border border-primary hover:bg-primary hover:text-on-primary transition-colors"
                >
                  MANAGE
                </Link>
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
                  <VaultLiveChart
                    key={params.id}
                    baseNav={Number(vault.nav.replace(/[^0-9.-]+/g, ''))}
                    accent={vault.accent}
                  />
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
                <span className="font-label-mono text-label-mono text-on-surface-variant block mb-6">CAPITAL SPLIT: {vault.splitRatio}</span>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Pie Chart */}
                  <div
                    className="w-40 h-40 rounded-full relative flex-shrink-0"
                    style={{
                      background: `conic-gradient(${vault.accent} 0% ${vault.splitPrincipal}%, var(--surface-variant, #2A2D2F) ${vault.splitPrincipal}% 100%)`,
                    }}
                  >
                    <div className="absolute inset-4 rounded-full bg-surface-container-lowest flex items-center justify-center">
                      <span className="font-headline-lg text-headline-lg">{vault.splitPrincipal}%</span>
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
                    {vault.insight}
                  </p>
                </div>
              </div>
            </section>

            {/* Right Column - Rebalance Events */}
            <section className="w-full lg:w-80 border-t lg:border-t-0 border-grid-line bg-surface-container-lowest p-margin-md flex flex-col gap-4 overflow-y-auto">
              <div className="font-label-mono text-label-mono text-on-surface-variant">REBALANCE_EVENTS</div>

              <div className="flex flex-col gap-3 text-xs font-label-mono">
                {vault.events.map((event: any, idx: number) => (
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

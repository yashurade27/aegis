'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function Strategy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow grid-bg relative">
        <div className="scanline"></div>
        <div className="max-w-[1440px] mx-auto border-x border-grid-line min-h-screen flex flex-col">
          {/* Hero Stats */}
          <section className="border-b border-grid-line p-margin-md md:p-margin-lg bg-surface-container-lowest">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-lg text-headline-lg text-on-surface">TOTAL_VALUE</span>
                  <span className="font-data-point text-data-point">USD</span>
                </div>
                <div className="font-headline-xl text-headline-xl">$142,842,091.00</div>
                <p className="text-on-surface-variant font-body-md max-w-md">
                  Institutional-grade structured vaults powered by Solana perps and lending markets. Algorithmic hedging meets decentralized transparency.
                </p>
              </div>

              <div className="flex flex-col gap-2 text-right">
                <span className="text-on-surface-variant font-label-mono text-label-mono">YIELD_FEE</span>
                <div className="font-headline-lg text-headline-lg text-vault-blue">18.42%</div>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <div className="flex-grow border-b border-grid-line flex flex-col lg:flex-row">
            {/* Left Column */}
            <section className="flex-1 border-r border-grid-line p-margin-md flex flex-col gap-margin-md">
              <div className="flex flex-col gap-4">
                <h2 className="font-headline-lg text-headline-lg uppercase">PROTECTED YIELD.</h2>
                <h2 className="font-headline-lg text-headline-lg uppercase">AMPLIFIED UPSIDE.</h2>
                <p className="text-on-surface-variant font-body-md leading-relaxed">
                  Institutional-grade structured vaults powered by Solana perps and lending markets. Algorithmic hedging meets decentralized transparency.
                </p>
              </div>

              <div className="flex gap-4 flex-wrap">
                <button className="px-6 py-2 border border-primary text-primary font-label-mono text-label-mono uppercase hover:bg-primary hover:text-on-primary transition-colors">
                  LAUNCH APP
                </button>
                <button className="px-6 py-2 border border-primary text-primary font-label-mono text-label-mono uppercase hover:bg-primary hover:text-on-primary transition-colors">
                  READ DOCS
                </button>
              </div>

              {/* Capital Strategy Box */}
              <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-6">
                <h3 className="font-headline-lg text-headline-lg uppercase">THE 80/20 CAPITAL STRATEGY</h3>
                <p className="text-on-surface-variant font-body-md">
                  Aegis Vaults utilize a delta-neutral architecture to preserve capital while capturing market inefficiencies.
                </p>

                <div className="flex flex-col gap-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full border-2 border-vault-blue flex items-center justify-center flex-shrink-0">
                      <span className="font-label-mono text-label-mono text-xs">01</span>
                    </div>
                    <div>
                      <h4 className="font-label-mono text-label-mono uppercase font-semibold">85% PRINCIPAL PROTECTION</h4>
                      <p className="text-on-surface-variant text-sm font-body-md">Deployed into blue-chip lending protocols (Solend, Kamino) generating stable baseline yield and maintaining 1:1 asset backing.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full border-2 border-secondary flex items-center justify-center flex-shrink-0">
                      <span className="font-label-mono text-label-mono text-xs">02</span>
                    </div>
                    <div>
                      <h4 className="font-label-mono text-label-mono uppercase font-semibold">20% ALPHA ENGINE</h4>
                      <p className="text-on-surface-variant text-sm font-body-md">Utilized for basis trading and leveraged funding rate capture on Solana perpetual exchanges (Drift, Zeta).</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Right Column - Charts */}
            <section className="flex-1 border-t lg:border-t-0 border-grid-line p-margin-md flex flex-col gap-margin-md">
              {/* Top chart area */}
              <div className="grid grid-cols-3 gap-px bg-grid-line">
                <div className="bg-background p-margin-sm flex flex-col gap-4">
                  <span className="font-label-mono text-label-mono text-terminal-gray text-xs uppercase">VAULT_DEV_PERFORMANCE</span>
                  <span className="text-on-surface-variant font-label-mono text-label-mono text-xs">[ LIVE ]</span>
                  <div className="h-32 flex items-end justify-around p-2 gap-1">
                    <div className="flex-1 h-12 bg-surface-variant rounded-t"></div>
                    <div className="flex-1 h-24 bg-primary rounded-t"></div>
                    <div className="flex-1 h-16 bg-surface-variant rounded-t"></div>
                  </div>
                </div>

                <div className="bg-background p-margin-sm flex flex-col gap-4">
                  <span className="font-label-mono text-label-mono text-terminal-gray text-xs uppercase">FUNDING_YIELD_AVG</span>
                  <div className="font-data-point text-data-point">12.1%</div>
                  <div className="h-32 flex items-end justify-around p-2 gap-1">
                    <div className="flex-1 h-16 bg-surface-dim rounded-t"></div>
                    <div className="flex-1 h-20 bg-surface-dim rounded-t"></div>
                    <div className="flex-1 h-24 bg-primary rounded-t"></div>
                  </div>
                </div>

                <div className="bg-background p-margin-sm flex flex-col gap-4">
                  <span className="font-label-mono text-label-mono text-terminal-gray text-xs uppercase">LENDING_POOL_APY</span>
                  <div className="font-data-point text-data-point">6.3%</div>
                  <div className="h-32 flex items-end justify-around p-2 gap-1">
                    <div className="flex-1 h-20 bg-surface-dim rounded-t"></div>
                    <div className="flex-1 h-24 bg-surface-dim rounded-t"></div>
                    <div className="flex-1 h-28 bg-primary rounded-t"></div>
                  </div>
                </div>
              </div>

              {/* Returns Simulator */}
              <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-4">
                <h3 className="font-label-mono text-label-mono uppercase">RETURNS SIMULATOR</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="font-label-mono text-label-mono text-terminal-gray text-xs">INVESTMENT_AMOUNT</span>
                    <div className="font-headline-lg text-headline-lg">$50,000</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="font-label-mono text-label-mono text-terminal-gray text-xs">TIME_HORIZON (MONTHS)</span>
                    <div className="font-headline-lg text-headline-lg">12x</div>
                  </div>
                </div>

                <div className="border-t border-grid-line pt-4">
                  <div className="bg-surface-dim p-4 rounded">
                    <div className="font-headline-lg text-headline-lg">$9,210.00</div>
                    <span className="text-on-surface-variant font-label-mono text-label-mono text-xs">[ +18.42% APY ]</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Security Section */}
          <section className="border-t border-grid-line p-margin-md bg-surface-container-lowest">
            <h2 className="font-headline-lg text-headline-lg uppercase mb-6">INSTITUTIONAL SECURITY</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-secondary">⚖</span>
                  <h3 className="font-label-mono text-label-mono uppercase font-semibold">S1: AUDITED_INFRA</h3>
                </div>
                <p className="text-on-surface-variant font-body-md text-sm">
                  Full smart contract audits conducted by market leaders. Zero critical vulnerabilities found in production.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-secondary">⚡</span>
                  <h3 className="font-label-mono text-label-mono uppercase font-semibold">S2: MULTI_SIG_CONTROL</h3>
                </div>
                <p className="text-on-surface-variant font-body-md text-sm">
                  All vault parameters require 3/5 consensus from the Aegis Council and independent custodians.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-secondary">🔐</span>
                  <h3 className="font-label-mono text-label-mono uppercase font-semibold">S3: REAL_TIME_GUARDRAILS</h3>
                </div>
                <p className="text-on-surface-variant font-body-md text-sm">
                  On-chain circuit breakers triggered automatically if leverage or slippage exceeds safety bounds.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 font-label-mono text-label-mono uppercase text-xs">
              <div>ZELLIC</div>
              <div>OTTERSEC</div>
              <div>QUILLST</div>
              <div>HALBORN</div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

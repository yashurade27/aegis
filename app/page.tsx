'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function VaultMarketplace() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow grid-bg relative">
        <div className="scanline"></div>
        <div className="max-w-[1440px] mx-auto border-x border-grid-line min-h-screen flex flex-col">
          {/* Hero Section */}
          <section className="border-b border-grid-line p-margin-md md:p-margin-lg">
            <div className="flex flex-col gap-4">
              <span className="text-vault-blue font-label-mono text-label-mono">[ SYSTEM: MARKETPLACE_DEPLOYED ]</span>
              <h1 className="font-headline-xl text-headline-xl uppercase tracking-tighter">VAULT MARKETPLACE</h1>
              <p className="text-on-surface-variant max-w-2xl font-body-md leading-relaxed">
                Choose your strategy. Deposit SOL. Earn yields. Our audited vaults automate everything—lending, trading, rebalancing. You focus on growth.
              </p>
            </div>
          </section>

          {/* Vaults Grid */}
          <div className="flex-grow border-b border-grid-line">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-grid-line">
              {/* Conservative SQL */}
              <Link href="/vault/conservative-sql">
                <div className="bg-surface-container-lowest p-margin-md flex flex-col gap-4 hover:bg-surface-container-low transition-colors cursor-pointer h-full border-r border-grid-line">
                  <div className="flex flex-col gap-2">
                    <span className="text-vault-blue font-label-mono text-label-mono">[ ID: 0x1-SOL-01 ]</span>
                    <span className="text-on-surface-variant font-label-mono text-label-mono text-xs">DEPLOYING LENDING BOT X6...</span>
                  </div>

                  <h3 className="font-headline-lg text-headline-lg uppercase">CONSERVATIVE SOL</h3>

                  <div className="flex gap-4 flex-wrap">
                    <button className="px-2 py-1 border border-on-surface-variant text-on-surface-variant font-label-mono text-label-mono hover:text-primary hover:border-primary transition-colors text-xs">
                      LENDING
                    </button>
                    <button className="px-2 py-1 border border-on-surface-variant text-on-surface-variant font-label-mono text-label-mono hover:text-primary hover:border-primary transition-colors text-xs">
                      LOW_YTL
                    </button>
                  </div>

                  <div className="flex justify-between items-start flex-wrap gap-4 flex-grow">
                    <div className="flex flex-col">
                      <span className="text-terminal-gray font-label-mono text-label-mono text-xs">TARGET_APY</span>
                      <span className="text-data-point font-headline-lg">12.4%</span>
                      <span className="text-terminal-gray font-label-mono text-label-mono text-xs">RISK_SCORE</span>
                      <span className="text-data-point font-headline-lg">2/10</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-terminal-gray font-label-mono text-label-mono text-xs">LEVERAGE</span>
                      <span className="text-data-point font-headline-lg">1x</span>
                      <span className="text-terminal-gray font-label-mono text-label-mono text-xs">LOCK_DURATION</span>
                      <span className="text-data-point font-headline-lg">7 Days</span>
                    </div>
                  </div>

                  <div className="w-full h-16 bg-grid-line relative mb-4">
                    <div className="absolute inset-0 flex items-end justify-around p-2">
                      <div className="w-1 h-8 bg-primary opacity-60"></div>
                      <div className="w-1 h-12 bg-primary opacity-70"></div>
                      <div className="w-1 h-6 bg-primary opacity-50"></div>
                      <div className="w-1 h-10 bg-primary opacity-65"></div>
                    </div>
                  </div>

                  <button className="w-full py-3 border border-primary text-primary font-label-mono text-label-mono uppercase hover:bg-primary hover:text-on-primary transition-all">
                    DEPOSIT
                  </button>
                  <button className="w-full py-2 text-primary font-label-mono text-label-mono uppercase hover:text-on-surface-variant transition-colors">
                    VIEW DETAILS
                  </button>
                </div>
              </Link>

              {/* ETH Momentum */}
              <Link href="/vault/eth-momentum">
                <div className="bg-surface-container-lowest p-margin-md flex flex-col gap-4 hover:bg-surface-container-low transition-colors cursor-pointer h-full border-r border-grid-line">
                  <div className="flex flex-col gap-2">
                    <span className="text-vault-blue font-label-mono text-label-mono">[ ID: 0x1-ETH-04 ]</span>
                    <span className="text-secondary font-label-mono text-label-mono text-xs">HIGH ALPHA</span>
                  </div>

                  <h3 className="font-headline-lg text-headline-lg uppercase">ETH MOMENTUM</h3>

                  <div className="flex gap-4 flex-wrap">
                    <button className="px-2 py-1 border border-on-surface-variant text-on-surface-variant font-label-mono text-label-mono hover:text-primary hover:border-primary transition-colors text-xs">
                      TREND
                    </button>
                    <button className="px-2 py-1 border border-on-surface-variant text-on-surface-variant font-label-mono text-label-mono hover:text-primary hover:border-primary transition-colors text-xs">
                      PERPS
                    </button>
                  </div>

                  <div className="flex justify-between items-start flex-wrap gap-4 flex-grow">
                    <div className="flex flex-col">
                      <span className="text-terminal-gray font-label-mono text-label-mono text-xs">TARGET_APY</span>
                      <span className="text-data-point font-headline-lg">24.8%</span>
                      <span className="text-terminal-gray font-label-mono text-label-mono text-xs">RISK_SCORE</span>
                      <span className="text-data-point font-headline-lg">6/10</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-terminal-gray font-label-mono text-label-mono text-xs">LEVERAGE</span>
                      <span className="text-data-point font-headline-lg">3x</span>
                      <span className="text-terminal-gray font-label-mono text-label-mono text-xs">LOCK_DURATION</span>
                      <span className="text-data-point font-headline-lg">14 Days</span>
                    </div>
                  </div>

                  <div className="w-full h-16 bg-grid-line relative mb-4">
                    <div className="absolute inset-0 flex items-end justify-around p-2">
                      <div className="w-1 h-6 bg-vault-blue opacity-60"></div>
                      <div className="w-1 h-10 bg-vault-blue opacity-70"></div>
                      <div className="w-1 h-8 bg-vault-blue opacity-50"></div>
                      <div className="w-1 h-12 bg-vault-blue opacity-65"></div>
                    </div>
                  </div>

                  <button className="w-full py-3 border border-primary text-primary font-label-mono text-label-mono uppercase hover:bg-primary hover:text-on-primary transition-all">
                    DEPOSIT
                  </button>
                  <button className="w-full py-2 text-primary font-label-mono text-label-mono uppercase hover:text-on-surface-variant transition-colors">
                    VIEW DETAILS
                  </button>
                </div>
              </Link>

              {/* BTC Funding Alpha */}
              <Link href="/vault/btc-funding-alpha">
                <div className="bg-surface-container-lowest p-margin-md flex flex-col gap-4 hover:bg-surface-container-low transition-colors cursor-pointer h-full">
                  <div className="flex flex-col gap-2">
                    <span className="text-vault-blue font-label-mono text-label-mono">[ ID: 0x-BTC-09 ]</span>
                    <span className="text-secondary font-label-mono text-label-mono text-xs">DELTA NEUTRAL</span>
                  </div>

                  <h3 className="font-headline-lg text-headline-lg uppercase">BTC FUNDING ALPHA</h3>

                  <div className="flex gap-4 flex-wrap">
                    <button className="px-2 py-1 border border-on-surface-variant text-on-surface-variant font-label-mono text-label-mono hover:text-primary hover:border-primary transition-colors text-xs">
                      BASIS
                    </button>
                    <button className="px-2 py-1 border border-on-surface-variant text-on-surface-variant font-label-mono text-label-mono hover:text-primary hover:border-primary transition-colors text-xs">
                      NEUTRAL
                    </button>
                  </div>

                  <div className="flex justify-between items-start flex-wrap gap-4 flex-grow">
                    <div className="flex flex-col">
                      <span className="text-terminal-gray font-label-mono text-label-mono text-xs">TARGET_APY</span>
                      <span className="text-data-point font-headline-lg">18.2%</span>
                      <span className="text-terminal-gray font-label-mono text-label-mono text-xs">RISK_SCORE</span>
                      <span className="text-data-point font-headline-lg">4/10</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-terminal-gray font-label-mono text-label-mono text-xs">LEVERAGE</span>
                      <span className="text-data-point font-headline-lg">2x</span>
                      <span className="text-terminal-gray font-label-mono text-label-mono text-xs">LOCK_DURATION</span>
                      <span className="text-data-point font-headline-lg">None</span>
                    </div>
                  </div>

                  <div className="w-full h-16 bg-grid-line relative mb-4">
                    <div className="absolute inset-0 flex items-end justify-around p-2">
                      <div className="w-1 h-10 bg-primary opacity-60"></div>
                      <div className="w-1 h-14 bg-primary opacity-70"></div>
                      <div className="w-1 h-12 bg-primary opacity-50"></div>
                      <div className="w-1 h-8 bg-primary opacity-65"></div>
                    </div>
                  </div>

                  <button className="w-full py-3 border border-primary text-primary font-label-mono text-label-mono uppercase hover:bg-primary hover:text-on-primary transition-all">
                    DEPOSIT
                  </button>
                  <button className="w-full py-2 text-primary font-label-mono text-label-mono uppercase hover:text-on-surface-variant transition-colors">
                    VIEW DETAILS
                  </button>
                </div>
              </Link>
            </div>
          </div>

          {/* Protocol Status */}
          <section className="border-t border-grid-line p-margin-md">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-vault-blue font-label-mono text-label-mono">[ PROTOCOL_STATUS ]</span>
                <a href="#" className="text-vault-blue font-label-mono text-label-mono hover:text-primary transition-colors">
                  LIVE BROADCAST
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-label-mono text-xs text-on-surface-variant">
                <div>• AUTHENTICATING_MARKET_FEED_PROVIDER...</div>
                <div>• VAULT_SOL_LIQUIDITY_CHECK: [ OK ]</div>
                <div>• REBALANCING_ETH_MOMENTUM_SIGMA_POSITIONS...</div>
                <div>• TOTAL_VALUE_SECURED: $412,984,201-35 USD</div>
                <div>• DEPLOYING_ARBITRAGE_BOT_V6...</div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

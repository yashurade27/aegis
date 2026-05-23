'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function BtcFundingAlphaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow grid-bg relative">
        <div className="scanline"></div>
        <div className="max-w-[1440px] mx-auto border-x border-grid-line min-h-screen flex flex-col">
          {/* Top Stats */}
          <section className="border-b border-grid-line p-margin-md bg-surface-container-lowest">
            <h1 className="font-headline-xl text-headline-lg uppercase mb-4">BTC FUNDING ALPHA</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-terminal-gray font-label-mono text-label-mono text-xs">TARGET_APY</span>
                <div className="font-headline-lg text-headline-lg">18.2%</div>
              </div>
              <div>
                <span className="text-terminal-gray font-label-mono text-label-mono text-xs">RISK_SCORE</span>
                <div className="font-headline-lg text-headline-lg">4/10</div>
              </div>
              <div>
                <span className="text-terminal-gray font-label-mono text-label-mono text-xs">LEVERAGE</span>
                <div className="font-headline-lg text-headline-lg">2x</div>
              </div>
              <div>
                <span className="text-terminal-gray font-label-mono text-label-mono text-xs">LOCK_DURATION</span>
                <div className="font-headline-lg text-headline-lg">None</div>
              </div>
            </div>
          </section>

          {/* Strategy Info */}
          <div className="flex-grow border-b border-grid-line p-margin-md">
            <div className="flex flex-col gap-6">
              <p className="text-on-surface-variant font-body-md leading-relaxed">
                Delta-neutral basis trading strategy capturing funding rate spreads on BTC perpetual markets. Maintains net-zero directional exposure while harvesting market inefficiencies.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="py-4 border border-primary text-primary font-label-mono text-label-mono uppercase hover:bg-primary hover:text-on-primary transition-all">
                  DEPOSIT
                </button>
                <button className="py-4 border border-primary text-primary font-label-mono text-label-mono uppercase hover:bg-primary hover:text-on-primary transition-all">
                  VIEW DETAILS
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

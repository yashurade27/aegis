'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  OrderBook,
  PlaceOrderForm,
  PositionTable,
  MarginHealthMeter,
  FundingRateBar,
  PriceChart,
} from '@/components/trading';
import { useTraderAccount } from '@/hooks/use-trader-account';
import { useMarket } from '@/hooks/use-market';

export default function TradePage() {
  const { healthBps, healthPct, totalUnrealizedPnl, collateralBalance } = useTraderAccount();
  const { markPrice, openInterest, fundingRate } = useMarket();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow grid-bg relative">
        <div className="scanline" />
        <div className="max-w-[1440px] mx-auto border-x border-grid-line min-h-screen flex flex-col">
          {/* Page Header */}
          <section className="border-b border-grid-line p-margin-md md:p-margin-lg">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-vault-blue font-label-mono text-label-mono">[ MODULE: TRADE_01 ]</span>
                <h1 className="font-headline-xl text-headline-xl uppercase tracking-tighter">SOL-PERP TRADING</h1>
                <p className="text-on-surface-variant font-label-mono text-label-mono uppercase text-xs">
                  LIVE ORDER BOOK — WASM MATCHING ENGINE
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-grid-line font-label-mono text-xs">
                <div className="bg-background p-3 flex flex-col gap-1">
                  <span className="text-terminal-gray uppercase">Mark</span>
                  <span className="text-primary text-sm">${markPrice.toFixed(2)}</span>
                </div>
                <div className="bg-background p-3 flex flex-col gap-1">
                  <span className="text-terminal-gray uppercase">Open Interest</span>
                  <span className="text-sm">{openInterest.toFixed(2)} SOL</span>
                </div>
                <div className="bg-background p-3 flex flex-col gap-1">
                  <span className="text-terminal-gray uppercase">Collateral</span>
                  <span className="text-sm">${collateralBalance.toLocaleString()}</span>
                </div>
                <div className="bg-background p-3 flex flex-col gap-1">
                  <span className="text-terminal-gray uppercase">Unrealized PnL</span>
                  <span className={`text-sm ${totalUnrealizedPnl >= 0 ? 'text-[#00FF41]' : 'text-red-400'}`}>
                    {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Main trading grid */}
          <div className="flex flex-col lg:flex-row flex-grow border-b border-grid-line">
            {/* Order book */}
            <aside className="w-full lg:w-[320px] border-r border-grid-line p-margin-md">
              <OrderBook className="h-[480px]" />
            </aside>

            {/* Price chart — centrepiece */}
            <section className="flex-grow border-r border-grid-line p-margin-md flex flex-col gap-4">
              <PriceChart />
              <FundingRateBar />
              <div className="border border-grid-line bg-surface-container-lowest p-4 font-label-mono text-xs text-terminal-gray flex flex-col gap-2">
                <span className="text-on-surface-variant uppercase">[ MARKET_INFO ]</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <span>Funding Rate</span>
                    <span className="text-on-surface">{(fundingRate / 100).toFixed(4)} bps/hr</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Maint. Margin</span>
                    <span className="text-on-surface">5.00%</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Taker Fee</span>
                    <span className="text-on-surface">0.10%</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span>Max Leverage</span>
                    <span className="text-on-surface">10x</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Order form + risk widgets */}
            <section className="w-full lg:w-[360px] p-margin-md flex flex-col gap-4">
              <PlaceOrderForm />
              <MarginHealthMeter healthBps={healthBps} healthPct={healthPct} />
            </section>
          </div>

          {/* Positions */}
          <section className="p-margin-md">
            <PositionTable defaultLeverage={5} />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}


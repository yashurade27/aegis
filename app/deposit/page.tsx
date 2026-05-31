'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function DepositFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [depositAmount, setDepositAmount] = useState(1000);
  const [lockDays, setLockDays] = useState(7);

  const projectedReturn = depositAmount * 0.185;
  const shares = depositAmount / 1.2847;
  const vaultId = searchParams.get('vault') ?? 'eth-momentum';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow grid-bg relative">
        <div className="scanline"></div>
        <div className="max-w-[1440px] mx-auto border-x border-grid-line min-h-screen flex flex-col">
          {/* Header */}
          <section className="border-b border-grid-line p-margin-md md:p-margin-lg">
            <div className="flex flex-col gap-4">
              <span className="text-vault-blue font-label-mono text-label-mono">[ DEPOSIT FLOW ]</span>
              <h1 className="font-headline-xl text-headline-lg uppercase tracking-tighter">DEPOSIT YOUR SOL</h1>
              <p className="text-on-surface-variant max-w-2xl font-body-md">
                Every deposit is protected. Lock your SOL. Earn algorithmic yields. Sleep soundly.
              </p>
            </div>
          </section>

          {/* Progress Steps */}
          <section className="border-b border-grid-line p-margin-md">
            <div className="grid grid-cols-3 gap-4">
              {[
                { num: 1, label: 'DEPOSIT', desc: 'Amount & Lock' },
                { num: 2, label: 'CONFIRM', desc: 'Review Terms' },
                { num: 3, label: 'EXECUTE', desc: 'Complete' },
              ].map((s) => (
                <div
                  key={s.num}
                  className={`border ${step >= s.num ? 'border-vault-blue bg-vault-blue bg-opacity-10' : 'border-grid-line'} p-4 text-center`}
                >
                  <div className={`text-lg font-headline-lg ${step >= s.num ? 'text-vault-blue' : 'text-on-surface-variant'}`}>
                    {s.num}
                  </div>
                  <div className="font-label-mono text-label-mono text-xs uppercase mt-1">{s.label}</div>
                  <div className="text-on-surface-variant text-xs mt-1">{s.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Content */}
          <div className="flex-grow border-b border-grid-line flex flex-col lg:flex-row">
            {/* Left - Form */}
            <section className="flex-1 border-r border-grid-line p-margin-md flex flex-col gap-margin-md">
              {step === 1 && (
                <>
                  <h2 className="font-headline-lg text-headline-lg uppercase">DEPOSIT AMOUNT</h2>

                  <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-mono text-label-mono text-xs">SOL AMOUNT</label>
                      <div className="flex items-center gap-2 border border-grid-line p-3 bg-surface">
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(Number(e.target.value))}
                          className="flex-1 bg-transparent outline-none font-headline-lg text-headline-lg"
                        />
                        <span className="text-on-surface-variant font-label-mono">SOL</span>
                      </div>
                    </div>

                    <div className="border-t border-grid-line pt-6 flex flex-col gap-4">
                      <h3 className="font-label-mono text-label-mono uppercase text-xs">LOCK PERIOD</h3>

                      <div className="grid grid-cols-3 gap-2">
                        {[7, 14, 30].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setLockDays(days)}
                            className={`p-3 border ${
                              lockDays === days ? 'border-primary bg-vault-blue bg-opacity-10' : 'border-grid-line'
                            } font-label-mono text-label-mono text-sm hover:border-primary transition-colors`}
                            aria-pressed={lockDays === days}
                          >
                            {days} DAYS
                          </button>
                        ))}
                      </div>

                      <p className="text-on-surface-variant text-sm font-body-md">
                        Longer lock periods earn higher yields. Your SOL is always protected and can be recovered.
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-3 bg-primary text-on-primary font-label-mono text-label-mono uppercase border border-primary hover:opacity-90 transition-opacity"
                    >
                      CONTINUE
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="font-headline-lg text-headline-lg uppercase">REVIEW & CONFIRM</h2>

                  <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-on-surface-variant">Deposit Amount</span>
                        <span className="font-headline-lg text-headline-lg">{depositAmount} SOL</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-on-surface-variant">Lock Period</span>
                        <span className="font-headline-lg text-headline-lg">{lockDays} Days</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-grid-line pt-4">
                        <span className="text-on-surface-variant">Vault Shares</span>
                        <span className="font-headline-lg text-headline-lg">{shares.toFixed(4)} shares</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-on-surface-variant">Share Price</span>
                        <span className="font-headline-lg text-headline-lg">$1.2847</span>
                      </div>
                    </div>
                  </div>

                  {/* Projected Returns */}
                  <div className="border border-grid-line bg-surface-container-lowest p-6 flex flex-col gap-4">
                    <h3 className="font-label-mono text-label-mono uppercase text-xs">PROJECTED_RETURNS</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-terminal-gray text-xs font-label-mono">YEAR_1_APY</span>
                        <span className="font-headline-lg text-headline-lg">18.5%</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-terminal-gray text-xs font-label-mono">ESTIMATED_RETURN</span>
                        <span className="font-headline-lg text-headline-lg text-[#00FF41]">${projectedReturn.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-terminal-gray text-xs font-label-mono">PROJECTED_NAV</span>
                        <span className="font-headline-lg text-headline-lg">${(depositAmount + projectedReturn).toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-terminal-gray text-xs font-label-mono">UNLOCK_DATE</span>
                        <span className="font-headline-lg text-headline-lg text-xs">+{lockDays}D</span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Disclosure */}
                  <div className="border border-grid-line bg-surface-dim p-6 flex gap-4 rounded">
                    <span className="text-secondary text-2xl flex-shrink-0">⚠</span>
                    <div className="text-on-surface-variant font-body-md text-sm space-y-2">
                      <p>
                        <strong>You understand that:</strong>
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Crypto assets carry market risk</li>
                        <li>Smart contracts, while audited, carry technical risk</li>
                        <li>Yields are not guaranteed and depend on market conditions</li>
                        <li>Your SOL will be locked for the selected period</li>
                        <li>Early withdrawal may result in penalty</li>
                      </ul>
                    </div>
                  </div>

                  {/* Strategy Allocation Preview */}
                  <div className="border border-grid-line bg-surface-container-lowest p-6">
                    <h3 className="font-label-mono text-label-mono uppercase text-xs mb-4">YOUR_CAPITAL_ALLOCATION</h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-surface-variant rounded"></div>
                        <span className="text-sm">80% to Solend/Kamino Lending</span>
                        <span className="text-xs text-terminal-gray ml-auto">{(depositAmount * 0.8).toFixed(2)} SOL</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-vault-blue rounded"></div>
                        <span className="text-sm">20% to Drift/Zeta Perp Trading</span>
                        <span className="text-xs text-terminal-gray ml-auto">{(depositAmount * 0.2).toFixed(2)} SOL</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 text-primary font-label-mono text-label-mono uppercase border border-primary hover:bg-primary hover:text-on-primary transition-colors"
                    >
                      BACK
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="flex-1 py-3 bg-primary text-on-primary font-label-mono text-label-mono uppercase border border-primary hover:opacity-90 transition-opacity"
                    >
                      CONFIRM
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="font-headline-lg text-headline-lg uppercase">DEPOSIT COMPLETE</h2>

                  <div className="border border-grid-line bg-surface-container-lowest p-8 flex flex-col items-center justify-center gap-6 min-h-96">
                    <div className="w-16 h-16 rounded-full border-2 border-vault-blue flex items-center justify-center animate-pulse">
                      <span className="text-2xl">✓</span>
                    </div>

                    <div className="text-center space-y-2">
                      <h3 className="font-headline-lg text-headline-lg">DEPOSITED!</h3>
                      <p className="text-on-surface-variant font-body-md">{depositAmount} SOL locked for {lockDays} days</p>
                    </div>

                    <div className="w-full border-t border-grid-line pt-6 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Transaction ID</span>
                        <span className="font-label-mono text-xs">0x9a2e...7f3c</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Unlock Date</span>
                        <span className="font-label-mono">June 1, 2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Vault Shares</span>
                        <span className="font-label-mono">{shares.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between border-t border-grid-line pt-3">
                        <span className="text-on-surface-variant">Projected Return</span>
                        <span className="font-headline-lg text-headline-lg text-[#00FF41]">${projectedReturn.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-4">
                    <button
                      type="button"
                      onClick={() => router.push(`/vault/${vaultId}`)}
                      className="flex-1 py-3 bg-primary text-on-primary font-label-mono text-label-mono uppercase border border-primary hover:opacity-90 transition-opacity"
                    >
                      VIEW DASHBOARD
                    </button>
                  </div>
                </>
              )}
            </section>

            {/* Right - Summary */}
            <section className="w-full lg:w-80 border-t lg:border-t-0 border-grid-line bg-surface-container-lowest p-margin-md flex flex-col gap-4">
              <h3 className="font-label-mono text-label-mono text-on-surface-variant uppercase text-xs">DEPOSIT_SUMMARY</h3>

              <div className="space-y-4 border-t border-grid-line pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-sm">Amount</span>
                  <span className="font-label-mono font-semibold">{depositAmount} SOL</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-sm">Lock Period</span>
                  <span className="font-label-mono font-semibold">{lockDays} Days</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-sm">Projected APY</span>
                  <span className="font-label-mono font-semibold text-vault-blue">18.5%</span>
                </div>

                <div className="flex justify-between items-center border-t border-grid-line pt-4">
                  <span className="text-on-surface-variant text-sm">Year 1 Return</span>
                  <span className="font-headline-lg text-headline-lg text-[#00FF41]">${projectedReturn.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-sm">Total NAV (Year 1)</span>
                  <span className="font-headline-lg text-headline-lg">${(depositAmount + projectedReturn).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-surface-dim rounded text-xs text-on-surface-variant space-y-2">
                <p>
                  <strong>Safe:</strong> 94.2% of principal protected through lending base layer.
                </p>
                <p>
                  <strong>Audited:</strong> Zellic, OtterSec, Quillst all approved.
                </p>
                <p>
                  <strong>Transparent:</strong> On-chain auditable, decentralized.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

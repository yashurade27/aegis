import './globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import type { Metadata } from 'next';
import { MarketProvider } from '@/lib/store/market-store';
import { WasmProvider } from '@/components/WasmProvider';
import { TraderProvider } from '@/lib/store/trader-store';
import { SolanaProvider } from '@/components/SolanaProvider';
import { MarketSimulator } from '@/components/MarketSimulator';

export const metadata: Metadata = {
  title: 'AEGIS VAULT | Institutional Grade Security',
  description: 'Access institutional-grade yields through cryptographically secure automated strategies',
  openGraph: {
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-surface font-body-md min-h-screen overflow-x-hidden">
        <SolanaProvider>
          <WasmProvider>
            <MarketProvider>
              <TraderProvider>
                <MarketSimulator />
                {children}
              </TraderProvider>
            </MarketProvider>
          </WasmProvider>
        </SolanaProvider>
      </body>
    </html>
  );
}

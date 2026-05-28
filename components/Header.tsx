'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || (path === '/' && (pathname === '/' || pathname === '/marketplace'));

  return (
    <header className="w-full sticky top-0 bg-background border-b border-grid-line z-50">
      <nav className="flex justify-between items-center w-full px-margin-lg h-16 max-w-[1440px] mx-auto border-x border-grid-line">
        <Link href="/landing" className="font-headline-lg text-headline-lg text-primary tracking-tighter uppercase hover:opacity-80 transition-opacity">
          AEGIS_VAULT
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className={`font-label-mono text-label-mono uppercase transition-colors ${
              isActive('/') || isActive('/marketplace') ? 'text-primary border-b border-primary pb-2' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Marketplace
          </Link>
          <Link
            href="/landing"
            className={`font-label-mono text-label-mono uppercase transition-colors ${
              isActive('/landing') ? 'text-primary border-b border-primary pb-2' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Home
          </Link>
          <Link
            href="/trade"
            className={`font-label-mono text-label-mono uppercase transition-colors ${
              isActive('/trade') ? 'text-primary border-b border-primary pb-2' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Trade
          </Link>
          <Link
            href="/simulator"
            className={`font-label-mono text-label-mono uppercase transition-colors ${
              isActive('/simulator') ? 'text-primary border-b border-primary pb-2' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Simulator
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <WalletMultiButton className="bg-transparent border border-grid-line text-on-surface-variant px-4 py-2 font-label-mono text-label-mono uppercase hover:text-primary hover:border-primary transition-colors" />
          <a href="/" className="bg-primary text-on-primary px-6 py-2 font-label-mono text-label-mono uppercase border border-primary hover:bg-transparent hover:text-primary transition-colors inline-block">
            LAUNCH APP
          </a>
        </div>
      </nav>
    </header>
  );
}

'use client';

import { useMemo } from 'react';
import { clusterApiUrl, type Commitment } from '@solana/web3.js';
import {
  ConnectionProvider,
  WalletProvider,
  useAnchorWallet,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { AnchorProvider, Program, type Idl } from '@coral-xyz/anchor';
import idl from '@/solperps/target/idl/solperps.json';
import { SolanaContext } from '@/lib/solana/solana-context';
import { SOLPERPS_PROGRAM_ID } from '@/lib/solana/constants';

function InnerSolanaProvider({
  children,
  endpoint,
  commitment,
}: {
  children: React.ReactNode;
  endpoint: string;
  commitment: Commitment;
}) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();

  const provider = useMemo(() => {
    if (!anchorWallet) return null;
    return new AnchorProvider(connection, anchorWallet, { commitment });
  }, [anchorWallet, commitment, connection]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(idl as Idl, provider);
  }, [provider]);

  const value = useMemo(
    () => ({
      connection,
      wallet,
      anchorWallet: anchorWallet || null,
      provider,
      program,
      programId: SOLPERPS_PROGRAM_ID,
      rpcEndpoint: endpoint,
    }),
    [anchorWallet, connection, endpoint, program, provider, wallet]
  );

  return <SolanaContext.Provider value={value}>{children}</SolanaContext.Provider>;
}

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl('devnet');
  const commitment = (process.env.NEXT_PUBLIC_SOLANA_COMMITMENT ?? 'confirmed') as Commitment;
  const walletNetwork = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? 'devnet') as WalletAdapterNetwork;
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network: walletNetwork }),
    ],
    [walletNetwork]
  );

  const ConnectionProviderAny = ConnectionProvider as any;
  const WalletProviderAny = WalletProvider as any;
  const WalletModalProviderAny = WalletModalProvider as any;

  return (
    <ConnectionProviderAny endpoint={endpoint}>
      <WalletProviderAny wallets={wallets} autoConnect>
        <WalletModalProviderAny>
          <InnerSolanaProvider endpoint={endpoint} commitment={commitment}>
            {children}
          </InnerSolanaProvider>
        </WalletModalProviderAny>
      </WalletProviderAny>
    </ConnectionProviderAny>
  );
}

import { createContext, useContext } from 'react';
import type { Connection, PublicKey } from '@solana/web3.js';
import type { AnchorProvider, Program } from '@coral-xyz/anchor';
import type { AnchorWallet, WalletContextState } from '@solana/wallet-adapter-react';
import type { Solperps } from '@/solperps/target/types/solperps';

export interface SolanaContextValue {
  connection: Connection;
  wallet: WalletContextState;
  anchorWallet: AnchorWallet | null;
  provider: AnchorProvider | null;
  program: Program<Solperps> | null;
  programId: PublicKey;
  rpcEndpoint: string;
}

export const SolanaContext = createContext<SolanaContextValue | null>(null);

export function useSolanaContext() {
  return useContext(SolanaContext);
}

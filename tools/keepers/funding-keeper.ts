// ============================================================================
// Funding Keeper — Settles funding rate on-chain every hour
// Calls `settle_funding` instruction on the solperps program.
// ============================================================================

import * as anchor from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction, Transaction } from '@solana/web3.js';
import { marketPda } from '../../lib/solana/pdas';

export interface FundingKeeperConfig {
  provider: anchor.AnchorProvider;
  programId: PublicKey;
  idl: any;
  markets: string[];
  intervalMs: number;
}

export function startFundingKeeper(config: FundingKeeperConfig): NodeJS.Timeout {
  const { provider, programId, idl, markets, intervalMs } = config;

  const instr = (idl.instructions || []).find((i: any) => i.name === 'settle_funding');
  if (!instr) throw new Error('settle_funding instruction not found in IDL');

  const ixData = Buffer.from(instr.discriminator || []);

  async function settleAll() {
    for (const symbol of markets) {
      try {
        const [marketKey] = marketPda(symbol);

        // Skip cleanly if the market hasn't been created on-chain yet.
        const marketInfo = await provider.connection.getAccountInfo(marketKey);
        if (!marketInfo) {
          console.log(`[funding] Market ${symbol} not found on-chain, skipping (run "npm run keepers:setup")`);
          continue;
        }

        const keys = [
          { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: false },
          { pubkey: marketKey, isSigner: false, isWritable: true },
        ];

        const ix = new TransactionInstruction({ keys, programId, data: ixData });
        const tx = new Transaction().add(ix);
        const sig = await provider.sendAndConfirm(tx, []);

        console.log(`[funding] Settled ${symbol} — sig=${sig}`);
      } catch (err) {
        console.error(`[funding] Error settling ${symbol}:`, (err as Error).message);
      }
    }
  }

  // Run immediately then schedule
  settleAll();
  return setInterval(settleAll, intervalMs);
}

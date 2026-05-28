import { SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { Program } from '@coral-xyz/anchor';
import type { PublicKey } from '@solana/web3.js';
import { DEFAULT_USDC_MINT } from './constants';
import { exchangePda, traderPda, traderVaultPda } from './pdas';

export async function ensureTraderAccount(params: {
  program: Program;
  owner: PublicKey;
  usdcMint?: PublicKey;
}) {
  const { program, owner, usdcMint = DEFAULT_USDC_MINT } = params;
  const [exchange] = exchangePda();
  const [traderAccount] = traderPda(owner);
  const [traderVault] = traderVaultPda(owner);

  const existing = await program.account.traderAccount.fetchNullable(traderAccount);
  if (existing) {
    return { exchange, traderAccount, traderVault };
  }

  await program.methods
    .initializeTrader()
    .accounts({
      owner,
      exchange,
      traderAccount,
      traderVault,
      usdcMint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  return { exchange, traderAccount, traderVault };
}

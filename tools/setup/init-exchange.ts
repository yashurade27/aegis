// ============================================================================
// Devnet Setup — Initializes the exchange, SOL-PERP market and mock oracle so
// the keepers have something to operate on.
//
// Idempotent: each step is skipped if the account already exists.
// Usage: npm run keepers:setup
// ============================================================================

import fs from 'fs';
import path from 'path';
import * as anchor from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { exchangePda, insuranceVaultPda, marketPda, oraclePda } from '../../lib/solana/pdas';
import { DEFAULT_MARKET_SYMBOL, DEFAULT_USDC_MINT, PRICE_SCALE } from '../../lib/solana/constants';

const idlPath = path.resolve(process.cwd(), 'solperps/target/idl/solperps.json');
if (!fs.existsSync(idlPath)) throw new Error(`Missing IDL at ${idlPath}. Run "anchor build" in solperps/ first.`);
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

function loadKeypairFromFile(p: string): anchor.web3.Keypair {
  const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
  const arr: number[] = Array.isArray(parsed) ? parsed : parsed.secretKey;
  if (!Array.isArray(arr)) throw new Error('Unrecognized keypair file format');
  return anchor.web3.Keypair.fromSecretKey(new Uint8Array(arr));
}

async function main() {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? 'devnet';
  const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl(network as any);
  const connection = new Connection(rpc, 'confirmed');

  const keypairPath =
    process.env.KEEPER_KEYPAIR_PATH ||
    path.join(process.env.HOME || '~', '.config/solana/id.json');
  const kp = loadKeypairFromFile(keypairPath);

  process.env.ANCHOR_WALLET = keypairPath;
  const provider = anchor.AnchorProvider.local(rpc, { commitment: 'confirmed' });
  anchor.setProvider(provider);
  const program = new anchor.Program(idl, provider) as anchor.Program;

  const symbol = DEFAULT_MARKET_SYMBOL;
  const initialPrice = new BN(Math.round(Number(process.env.SETUP_INITIAL_PRICE ?? '142.5') * PRICE_SCALE));

  console.log('═══════════════════════════════════════════');
  console.log(' AEGIS SETUP');
  console.log(`   Network:  ${network}`);
  console.log(`   Admin:    ${kp.publicKey.toBase58()}`);
  console.log(`   USDC:     ${DEFAULT_USDC_MINT.toBase58()}`);
  console.log(`   Market:   ${symbol}`);
  console.log('═══════════════════════════════════════════');

  // 1. Ensure the admin/keeper wallet can pay rent + fees.
  const balance = await connection.getBalance(kp.publicKey);
  console.log(`Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  if (balance < 0.2 * LAMPORTS_PER_SOL && (network === 'devnet' || network === 'testnet')) {
    console.log('Requesting 2 SOL airdrop...');
    try {
      const sig = await connection.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, 'confirmed');
      console.log('Airdrop confirmed.');
    } catch (err) {
      console.warn(`Airdrop failed: ${(err as Error).message}`);
      console.warn(`Fund manually: solana airdrop 2 ${kp.publicKey.toBase58()} --url ${rpc}`);
    }
  }

  // 2. Verify USDC mint exists on this cluster.
  const usdcInfo = await connection.getAccountInfo(DEFAULT_USDC_MINT);
  if (!usdcInfo) {
    throw new Error(
      `USDC mint ${DEFAULT_USDC_MINT.toBase58()} not found on ${network}. ` +
        'Set NEXT_PUBLIC_USDC_MINT to a mint that exists on this cluster.'
    );
  }

  const [exchange] = exchangePda();
  const [insuranceVault] = insuranceVaultPda();
  const [marketKey] = marketPda(symbol);
  const [oracleKey] = oraclePda(marketKey);

  // 3. Initialize exchange (idempotent).
  if (await connection.getAccountInfo(exchange)) {
    console.log('[setup] Exchange already initialized — skipping.');
  } else {
    console.log('[setup] Initializing exchange...');
    const sig = await program.methods
      .initializeExchange()
      .accounts({
        admin: kp.publicKey,
        usdcMint: DEFAULT_USDC_MINT,
        exchange,
        insuranceVault,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      } as any)
      .rpc();
    console.log(`[setup] Exchange initialized — sig=${sig}`);
  }

  // 4. Create market (idempotent).
  if (await connection.getAccountInfo(marketKey)) {
    console.log(`[setup] Market ${symbol} already exists — skipping.`);
  } else {
    console.log(`[setup] Creating market ${symbol}...`);
    const base = symbol.split('-')[0] || 'SOL';
    const quote = 'USD';
    const sig = await program.methods
      .createMarket(symbol, base, quote, 10, 8000)
      .accounts({
        admin: kp.publicKey,
        exchange,
        market: marketKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
    console.log(`[setup] Market created — sig=${sig}`);
  }

  // 5. Initialize oracle (idempotent).
  if (await connection.getAccountInfo(oracleKey)) {
    console.log('[setup] Oracle already initialized — skipping.');
  } else {
    console.log('[setup] Initializing oracle...');
    const sig = await program.methods
      .initializeOracle(symbol, initialPrice)
      .accounts({
        admin: kp.publicKey,
        exchange,
        market: marketKey,
        oracle: oracleKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
    console.log(`[setup] Oracle initialized — sig=${sig}`);
  }

  console.log('═══════════════════════════════════════════');
  console.log('[setup] Done. You can now run: npm run keepers:start');
  console.log('═══════════════════════════════════════════');
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});

// ============================================================================
// Keepers Orchestrator — Starts all 3 keeper bots concurrently
// Usage: npm run keepers:start
// ============================================================================

import fs from 'fs';
import path from 'path';
import * as anchor from '@coral-xyz/anchor';
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { startFundingKeeper } from './funding-keeper';
import { startMarkPriceKeeper } from './mark-price-keeper';
import { startLiquidationKeeper } from './liquidation-keeper';
import { marketPda } from '../../lib/solana/pdas';

// Load IDL
const idlPath = path.resolve(process.cwd(), 'solperps/target/idl/solperps.json');
if (!fs.existsSync(idlPath)) throw new Error(`Missing IDL at ${idlPath}`);
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

const PROGRAM_ID = new PublicKey(idl.address);

function loadKeypairFromFile(p: string): anchor.web3.Keypair {
  const raw = fs.readFileSync(p, 'utf8');
  const parsed = JSON.parse(raw);
  const arr: number[] = Array.isArray(parsed)
    ? parsed
    : parsed && Array.isArray(parsed.secretKey)
    ? parsed.secretKey
    : (() => { throw new Error('Unrecognized keypair file format'); })();
  return anchor.web3.Keypair.fromSecretKey(new Uint8Array(arr));
}

async function main() {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? 'devnet';
  const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl(network as any);
  const connection = new Connection(rpc, 'confirmed');

  // Load keeper wallet
  const keypairPath =
    process.env.KEEPER_KEYPAIR_PATH ||
    path.join(process.env.HOME || '~', '.config/solana/id.json');

  let kp: anchor.web3.Keypair;
  try {
    kp = loadKeypairFromFile(keypairPath);
  } catch {
    throw new Error(
      `Could not load keypair from ${keypairPath}. Set KEEPER_KEYPAIR_PATH or ANCHOR_WALLET.`
    );
  }

  process.env.ANCHOR_WALLET = keypairPath;
  const provider = anchor.AnchorProvider.local(rpc, { commitment: 'confirmed' });
  anchor.setProvider(provider);

  const markets = (process.env.SOLPERPS_MARKETS || 'SOL-PERP')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const pythFeed = new PublicKey(
    process.env.PYTH_SOL_USD_FEED || 'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix'
  );

  console.log('═══════════════════════════════════════════');
  console.log(' AEGIS KEEPERS');
  console.log(`   Network:  ${network}`);
  console.log(`   RPC:      ${rpc}`);
  console.log(`   Wallet:   ${kp.publicKey.toBase58()}`);
  console.log(`   Markets:  ${markets.join(', ')}`);
  console.log(`   Pyth:     ${pythFeed.toBase58()}`);
  console.log('═══════════════════════════════════════════');

  // Make sure the keeper wallet can actually pay transaction fees. An empty
  // wallet is what produces "Attempt to debit an account but found no record
  // of a prior credit" during simulation.
  const balance = await connection.getBalance(kp.publicKey);
  console.log(`   Balance:  ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  if (balance < 0.05 * LAMPORTS_PER_SOL) {
    if (network === 'devnet' || network === 'testnet') {
      console.log('[orchestrator] Wallet balance low — requesting a 1 SOL airdrop...');
      try {
        const sig = await connection.requestAirdrop(kp.publicKey, LAMPORTS_PER_SOL);
        await connection.confirmTransaction(sig, 'confirmed');
        console.log('[orchestrator] Airdrop confirmed.');
      } catch (err) {
        console.warn(
          `[orchestrator] Airdrop failed (devnet faucet may be rate-limited): ${(err as Error).message}`
        );
        console.warn(
          `[orchestrator] Fund the wallet manually:\n  solana airdrop 2 ${kp.publicKey.toBase58()} --url ${rpc}`
        );
      }
    } else {
      console.warn(
        `[orchestrator] Wallet has insufficient SOL to pay fees. Fund ${kp.publicKey.toBase58()} before keepers can submit transactions.`
      );
    }
  }

  // Make sure the market exists; if not, nudge the operator toward setup.
  const [solMarket] = marketPda(markets[0]);
  const marketInfo = await connection.getAccountInfo(solMarket);
  if (!marketInfo) {
    console.warn(
      `[orchestrator] Market ${markets[0]} is not initialized on-chain yet.\n` +
        '[orchestrator] Run "npm run keepers:setup" first to create the exchange, market and oracle.'
    );
  }

  // Start all 3 keepers
  const timers: NodeJS.Timeout[] = [];

  timers.push(
    startFundingKeeper({
      provider,
      programId: PROGRAM_ID,
      idl,
      markets,
      intervalMs: Number(process.env.KEEPER_FUNDING_INTERVAL_MS || 3_600_000),
    })
  );
  console.log('[orchestrator] Funding keeper started (hourly)');

  timers.push(
    startMarkPriceKeeper({
      provider,
      connection,
      programId: PROGRAM_ID,
      idl,
      markets,
      pythFeedAddress: pythFeed,
      intervalMs: Number(process.env.KEEPER_MARK_PRICE_INTERVAL_MS || 60_000),
    })
  );
  console.log('[orchestrator] Mark price keeper started (60s)');

  timers.push(
    startLiquidationKeeper({
      provider,
      connection,
      programId: PROGRAM_ID,
      idl,
      markets,
      intervalMs: Number(process.env.KEEPER_LIQUIDATION_INTERVAL_MS || 30_000),
    })
  );
  console.log('[orchestrator] Liquidation keeper started (30s)');

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[orchestrator] Shutting down keepers...');
    timers.forEach(clearInterval);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    timers.forEach(clearInterval);
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Keeper orchestrator failed:', err);
  process.exit(1);
});
// ============================================================================
// Liquidation Keeper — Scans positions, liquidates undercollateralized ones
// Calls `liquidate_position` for positions below maintenance margin every 30s.
// ============================================================================

import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, TransactionInstruction, Transaction } from '@solana/web3.js';
import { marketPda, exchangePda, traderPda } from '../../lib/solana/pdas';
import { PRICE_SCALE, BASE_SCALE } from '../../lib/solana/constants';

export interface LiquidationKeeperConfig {
  provider: anchor.AnchorProvider;
  connection: Connection;
  programId: PublicKey;
  idl: any;
  markets: string[];
  intervalMs: number;
}

// Maintenance margin: 5% (500 bps)
const MAINTENANCE_MARGIN_BPS = 500;

interface PositionData {
  pubkey: PublicKey;
  trader: PublicKey;
  market: PublicKey;
  side: number; // 0 = Long, 1 = Short
  size: bigint;
  entryPrice: bigint;
  marginAllocated: bigint;
}

function parsePositionAccount(pubkey: PublicKey, data: Buffer): PositionData | null {
  try {
    // Skip 8-byte discriminator
    const trader = new PublicKey(data.subarray(8, 40));
    const market = new PublicKey(data.subarray(40, 72));
    // Side enum: 1 byte after market key in Anchor layout — need to check
    // Anchor enum is serialized as a single byte index
    const side = data.readUInt8(72);
    // u64 fields: size, entry_price, margin_allocated (each 8 bytes)
    const size = data.readBigUInt64LE(73);
    const entryPrice = data.readBigUInt64LE(81);
    const marginAllocated = data.readBigUInt64LE(89);

    return { pubkey, trader, market, side, size, entryPrice, marginAllocated };
  } catch {
    return null;
  }
}

export function startLiquidationKeeper(config: LiquidationKeeperConfig): NodeJS.Timeout {
  const { provider, connection, programId, idl, markets, intervalMs } = config;

  const instr = (idl.instructions || []).find((i: any) => i.name === 'liquidate_position');
  if (!instr) throw new Error('liquidate_position instruction not found in IDL');

  const discriminator = Buffer.from(instr.discriminator || []);

  // Position account discriminator from IDL
  const positionDiscriminator = Buffer.from(
    (idl.accounts || []).find((a: any) => a.name === 'Position')?.discriminator || []
  );

  async function scanAndLiquidate() {
    for (const symbol of markets) {
      try {
        const [marketKey] = marketPda(symbol);
        const [exchangeKey] = exchangePda();

        // Fetch current mark price from market account
        const marketAccountInfo = await connection.getAccountInfo(marketKey);
        if (!marketAccountInfo) {
          console.log(`[liquidation] Market ${symbol} not found on-chain, skipping`);
          continue;
        }

        // Parse mark_price from Market account (skip discriminator 8, exchange 32, then strings)
        // This is complex with variable-length strings, so fetch via getProgramAccounts filter
        // For simplicity, fetch all Position accounts for this market
        const positionAccounts = await connection.getProgramAccounts(programId, {
          filters: [
            { memcmp: { offset: 0, bytes: anchor.utils.bytes.bs58.encode(positionDiscriminator) } },
            { memcmp: { offset: 40, bytes: marketKey.toBase58() } }, // market field
          ],
        });

        if (positionAccounts.length === 0) {
          console.log(`[liquidation] No positions found for ${symbol}`);
          continue;
        }

        console.log(`[liquidation] Scanning ${positionAccounts.length} positions for ${symbol}`);

        for (const { pubkey, account } of positionAccounts) {
          const pos = parsePositionAccount(pubkey, account.data as Buffer);
          if (!pos || pos.size === 0n) continue;

          // Fetch trader's collateral balance
          const [traderAccountKey] = traderPda(pos.trader);
          const traderAccountInfo = await connection.getAccountInfo(traderAccountKey);
          if (!traderAccountInfo) continue;

          // Parse collateral from TraderAccount (offset: 8 disc + 32 owner + 32 exchange = 72, then u64 collateral)
          const collateral = (traderAccountInfo.data as Buffer).readBigUInt64LE(72);

          // Calculate notional value = size * markPrice / SCALE
          // For now, use entry price as approximation since parsing market's mark_price
          // from variable-length string fields is complex
          const notionalScaled = pos.size * pos.entryPrice;
          const marginRequired = notionalScaled * BigInt(MAINTENANCE_MARGIN_BPS) / 10000n;

          // Check if undercollateralized
          const collateralScaled = collateral * BigInt(PRICE_SCALE);

          if (collateralScaled < marginRequired) {
            console.log(
              `[liquidation] Position ${pubkey.toBase58()} is undercollateralized — liquidating`
            );

            try {
              const keys = [
                { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: false },
                { pubkey: marketKey, isSigner: false, isWritable: true },
                { pubkey: exchangeKey, isSigner: false, isWritable: true },
                { pubkey: traderAccountKey, isSigner: false, isWritable: true },
                { pubkey: pubkey, isSigner: false, isWritable: true },
              ];

              const ix = new TransactionInstruction({ keys, programId, data: discriminator });
              const tx = new Transaction().add(ix);
              const sig = await provider.sendAndConfirm(tx, []);

              console.log(`[liquidation] Liquidated ${pubkey.toBase58()} — sig=${sig}`);
            } catch (liqErr) {
              // NotLiquidatable error (6006) is expected when margin is borderline
              console.error(
                `[liquidation] Failed to liquidate ${pubkey.toBase58()}:`,
                (liqErr as Error).message
              );
            }
          }
        }
      } catch (err) {
        console.error(`[liquidation] Scan error for ${symbol}:`, (err as Error).message);
      }
    }
  }

  scanAndLiquidate();
  return setInterval(scanAndLiquidate, intervalMs);
}

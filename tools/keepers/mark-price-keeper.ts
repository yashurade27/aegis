// ============================================================================
// Mark Price Keeper — Fetches real SOL/USD from Pyth devnet, pushes on-chain
// Calls `update_oracle` instruction every 60s with the latest Pyth price.
// ============================================================================

import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, TransactionInstruction, Transaction } from '@solana/web3.js';
import { marketPda, oraclePda } from '../../lib/solana/pdas';
import { PRICE_SCALE } from '../../lib/solana/constants';

export interface MarkPriceKeeperConfig {
  provider: anchor.AnchorProvider;
  connection: Connection;
  programId: PublicKey;
  idl: any;
  markets: string[];
  pythFeedAddress: PublicKey;
  intervalMs: number;
}

/**
 * Parse price from a Pyth price feed account.
 * Reads the price and exponent directly from the account data buffer.
 * Pyth V2 account layout: price at offset 208 (i64), exponent at offset 20 (i32).
 */
async function fetchPythPrice(connection: Connection, feedAddress: PublicKey): Promise<number> {
  const accountInfo = await connection.getAccountInfo(feedAddress);
  if (!accountInfo || !accountInfo.data) {
    throw new Error(`Pyth feed account ${feedAddress.toBase58()} not found`);
  }

  const data = accountInfo.data;

  // Pyth V2 price feed layout
  // Exponent: i32 at offset 20
  // Aggregate price: i64 at offset 208
  const exponent = data.readInt32LE(20);
  const priceRaw = Number(data.readBigInt64LE(208));

  if (priceRaw <= 0) {
    throw new Error('Pyth feed returned non-positive price');
  }

  return priceRaw * Math.pow(10, exponent);
}

export function startMarkPriceKeeper(config: MarkPriceKeeperConfig): NodeJS.Timeout {
  const { provider, connection, programId, idl, markets, pythFeedAddress, intervalMs } = config;

  const instr = (idl.instructions || []).find((i: any) => i.name === 'update_oracle');
  if (!instr) throw new Error('update_oracle instruction not found in IDL');

  const discriminator = Buffer.from(instr.discriminator || []);

  async function updateAll() {
    let price: number;
    try {
      price = await fetchPythPrice(connection, pythFeedAddress);
      console.log(`[mark-price] Pyth SOL/USD = $${price.toFixed(4)}`);
    } catch (err) {
      console.error(`[mark-price] Failed to fetch Pyth price:`, (err as Error).message);
      return;
    }

    const priceScaled = BigInt(Math.round(price * PRICE_SCALE));

    for (const symbol of markets) {
      try {
        const [marketKey] = marketPda(symbol);
        const [oracleKey] = oraclePda(marketKey);

        // Skip cleanly if the market/oracle haven't been created on-chain yet.
        const [marketInfo, oracleInfo] = await Promise.all([
          connection.getAccountInfo(marketKey),
          connection.getAccountInfo(oracleKey),
        ]);
        if (!marketInfo || !oracleInfo) {
          console.log(`[mark-price] Market/oracle for ${symbol} not found on-chain, skipping (run "npm run keepers:setup")`);
          continue;
        }

        // Encode: discriminator + new_price (u64 LE)
        const priceBuf = Buffer.alloc(8);
        priceBuf.writeBigUInt64LE(priceScaled);
        const ixData = Buffer.concat([discriminator, priceBuf]);

        const keys = [
          { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: false },
          { pubkey: oracleKey, isSigner: false, isWritable: true },
          { pubkey: marketKey, isSigner: false, isWritable: true },
        ];

        const ix = new TransactionInstruction({ keys, programId, data: ixData });
        const tx = new Transaction().add(ix);
        const sig = await provider.sendAndConfirm(tx, []);

        console.log(`[mark-price] Updated ${symbol} to $${price.toFixed(4)} — sig=${sig}`);
      } catch (err) {
        console.error(`[mark-price] Error updating ${symbol}:`, (err as Error).message);
      }
    }
  }

  updateAll();
  return setInterval(updateAll, intervalMs);
}

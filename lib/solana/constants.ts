import { PublicKey } from '@solana/web3.js';

export const SOLPERPS_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_SOLPERPS_PROGRAM_ID ??
    'AJ3heSpYpqgqMNvJ7L1W1W1RqZfDUixayyyvSedRGAAT'
);

export const DEFAULT_MARKET_SYMBOL =
  process.env.NEXT_PUBLIC_SOLPERPS_MARKET_SYMBOL ?? 'SOL-PERP';

export const DEFAULT_USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT ??
    '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
);

export const PRICE_SCALE = 1_000_000;
export const BASE_SCALE = 1_000_000;
export const USDC_DECIMALS = 6;

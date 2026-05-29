import { PublicKey } from '@solana/web3.js';

export const SOLPERPS_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_SOLPERPS_PROGRAM_ID ??
    'AJ3heSpYpqgqMNvJ7L1W1W1RqZfDUixayyyvSedRGAAT'
);

export const DEFAULT_MARKET_SYMBOL =
  process.env.NEXT_PUBLIC_SOLPERPS_MARKET_SYMBOL ?? 'SOL-PERP';

// On-chain mode is opt-in. Until the program is deployed AND the exchange/market
// are initialized on the target cluster, connecting a wallet must NOT switch the
// UI into on-chain mode (otherwise the market, order book and positions all read
// back empty). Set NEXT_PUBLIC_USE_ONCHAIN=true once devnet has been set up via
// `npm run keepers:setup`.
export const USE_ONCHAIN = process.env.NEXT_PUBLIC_USE_ONCHAIN === 'false';

export const DEFAULT_USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT ??
    '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
);

export const PRICE_SCALE = 1_000_000;
export const BASE_SCALE = 1_000_000;
export const USDC_DECIMALS = 6;

// Pyth devnet SOL/USD price feed account
export const PYTH_SOL_USD_FEED = new PublicKey(
  process.env.NEXT_PUBLIC_PYTH_SOL_USD_FEED ??
    'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix'
);

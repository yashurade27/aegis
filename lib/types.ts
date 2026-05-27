// ============================================================================
// Aegis Vault — Core Domain Types
// Pure TypeScript types for the perpetuals DEX engine.
// Uses `number` for simulation; on-chain will use u64/BN.
// ============================================================================

export enum Side {
  Long = 'Long',
  Short = 'Short',
}

export enum OrderType {
  Limit = 'Limit',
  Market = 'Market',
}

export interface Order {
  id: number;
  trader: string; // address / identifier
  side: Side;
  orderType: OrderType;
  price: number; // ignored for market orders
  size: number; // remaining size
  timestamp: number;
}

export interface Fill {
  maker: string;
  taker: string;
  price: number;
  size: number;
  fee: number;
  side: Side; // taker side
}

export interface Position {
  market: string;
  side: Side;
  size: number;
  entryPrice: number;
  marginAllocated: number;
  unrealizedPnl: number;
}

export interface Market {
  address: string;
  baseAsset: string;
  quoteAsset: string;
  bids: Order[]; // sorted descending by price
  asks: Order[]; // sorted ascending by price
  bestBid: number;
  bestAsk: number;
  openInterest: number;
  markPrice: number;
  indexPrice: number;
  feeBps: number; // e.g. 10 = 0.10%
  insuranceFundCutBps: number; // e.g. 8000 = 80% of fee to insurance
}

export interface TraderAccount {
  owner: string;
  collateralBalance: number;
  positions: Position[];
}

export interface InsuranceFund {
  balance: number;
  totalCollected: number;
  totalClaimed: number;
}

// Constants
export const MAX_FUNDING_RATE_BPS = 75; // ±75 bps per hour
export const FUNDING_FACTOR = 10000;
export const DEFAULT_MAINTENANCE_MARGIN_BPS = 500; // 5%
export const BPS_DENOMINATOR = 10000;

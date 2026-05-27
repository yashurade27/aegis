'use client';

// ============================================================================
// Aegis Vault — Market Store (React Context)
// Provides simulated SOL-PERP market state backed by the real matching engine.
// ============================================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import {
  createMarket,
  matchOrder,
  cancelOrder as cancelOrderFromBook,
  insertOrderIntoBook,
  computeFundingRate,
  applyFunding,
} from '@/engine/pkg/engine';
import {
  type Market,
  type Order,
  type Fill,
  Side,
  OrderType,
} from '@/lib/types';
import { fromWasm, type CancelOrderResult, type MatchOrderResult } from '@/lib/wasm-utils';

// ── State ──────────────────────────────────────────────────────────────────

export interface MarketState {
  market: Market;
  recentFills: Fill[];
  error: string | null;
}

const getInitialMarket = () => {
  let m = createMarket('SOL-PERP', 'SOL', 'USD', 10, 8000);
  m.markPrice = 142.5;
  m.indexPrice = 142.0;

  // Seed the order book with realistic mock orders
  let id = 1;
  const now = Date.now();

  // Asks (sells) — ascending from 142.50
  [142.5, 143.0, 143.5, 144.0, 144.5].forEach((price, i) => {
    m = insertOrderIntoBook(m, {
      id: id++,
      trader: `market-maker-${i}`,
      side: Side.Short,
      orderType: OrderType.Limit,
      price,
      size: Math.round(10 + Math.random() * 40),
      timestamp: now + i,
    });
  });

  // Bids (buys) — descending from 142.00
  [142.0, 141.5, 141.0, 140.5, 140.0].forEach((price, i) => {
    m = insertOrderIntoBook(m, {
      id: id++,
      trader: `market-maker-${i + 5}`,
      side: Side.Long,
      orderType: OrderType.Limit,
      price,
      size: Math.round(10 + Math.random() * 40),
      timestamp: now + i,
    });
  });

  return m;
};

// ── Actions ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'PLACE_ORDER'; order: Order }
  | { type: 'CANCEL_ORDER'; orderId: number; side: Side }
  | { type: 'SETTLE_FUNDING' }
  | { type: 'UPDATE_PRICES'; markPrice: number; indexPrice: number }
  | { type: 'CLEAR_ERROR' };

function reducer(state: MarketState, action: Action): MarketState {
  // Deep-clone market to ensure React re-renders properly
  const market = {
    ...state.market,
    bids: [...state.market.bids.map((o) => ({ ...o }))],
    asks: [...state.market.asks.map((o) => ({ ...o }))],
  };

  switch (action.type) {
    case 'PLACE_ORDER': {
      try {
        const result = fromWasm<MatchOrderResult>(
          matchOrder(market, { ...action.order })
        );
        return {
          ...state,
          market: result.market,
          recentFills: [...result.fills, ...state.recentFills].slice(0, 50),
          error: null,
        };
      } catch (e) {
        return { ...state, error: (e as Error).message };
      }
    }

    case 'CANCEL_ORDER': {
      const result = fromWasm<CancelOrderResult>(
        cancelOrderFromBook(market, BigInt(action.orderId), action.side)
      );
      return {
        ...state,
        market: result.market,
        error: null,
      };
    }

    case 'SETTLE_FUNDING': {
      const rate = computeFundingRate(market.markPrice, market.indexPrice);
      // Funding state is tracked on TraderAccount (handled in trader store)
      // Here we just update market state
      return { ...state, market };
    }

    case 'UPDATE_PRICES': {
      market.markPrice = action.markPrice;
      market.indexPrice = action.indexPrice;
      return { ...state, market };
    }

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────────

interface MarketContextValue {
  state: MarketState;
  placeOrder: (params: {
    trader: string;
    side: Side;
    orderType: OrderType;
    price: number;
    size: number;
  }) => void;
  cancelOrder: (orderId: number, side: Side) => void;
  settleFunding: () => void;
  updatePrices: (markPrice: number, indexPrice: number) => void;
}

const MarketContext = createContext<MarketContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────

let nextOrderId = 1000;

export function MarketProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    market: getInitialMarket(),
    recentFills: [],
    error: null,
  }));

  const placeOrder = useCallback(
    (params: {
      trader: string;
      side: Side;
      orderType: OrderType;
      price: number;
      size: number;
    }) => {
      const order: Order = {
        id: nextOrderId++,
        trader: params.trader,
        side: params.side,
        orderType: params.orderType,
        price: params.price,
        size: params.size,
        timestamp: Date.now(),
      };
      dispatch({ type: 'PLACE_ORDER', order });
    },
    []
  );

  const cancelOrder = useCallback((orderId: number, side: Side) => {
    dispatch({ type: 'CANCEL_ORDER', orderId, side });
  }, []);

  const settleFunding = useCallback(() => {
    dispatch({ type: 'SETTLE_FUNDING' });
  }, []);

  const updatePrices = useCallback(
    (markPrice: number, indexPrice: number) => {
      dispatch({ type: 'UPDATE_PRICES', markPrice, indexPrice });
    },
    []
  );

  return (
    <MarketContext.Provider
      value={{ state, placeOrder, cancelOrder, settleFunding, updatePrices }}
    >
      {children}
    </MarketContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useMarketStore() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarketStore must be used inside <MarketProvider>');
  return ctx;
}

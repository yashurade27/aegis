'use client';

// ============================================================================
// Aegis Vault — Trader Store (React Context)
// Manages trader account state: collateral, positions, deposit/withdraw.
// ============================================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import { calculateUnrealizedPnl, settlePnl, applyFunding, computeFundingRate, canWithdraw, routeFeeToInsurance, createInsuranceFund, totalUnrealizedPnl } from '@/engine/pkg/engine';
import { type TraderAccount, type Fill, type InsuranceFund, Side } from '@/lib/types';

// ── State ──────────────────────────────────────────────────────────────────

export interface TraderState {
  account: TraderAccount;
  insuranceFund: InsuranceFund;
  markPrices: Map<string, number>;
  loading: boolean;
  error: string | null;
}

const getInitialState = (): TraderState => ({
  account: {
    owner: 'demo-user',
    collateralBalance: 10000, // $10,000 starting collateral
    positions: [],
  },
  insuranceFund: createInsuranceFund(),
  markPrices: new Map([['SOL-PERP', 142.5]]),
  loading: false,
  error: null,
});

// ── Actions ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'DEPOSIT'; amount: number }
  | { type: 'WITHDRAW'; amount: number }
  | { type: 'APPLY_FILL'; fill: Fill; feeBps: number; insuranceCutBps: number }
  | { type: 'CLOSE_POSITION'; marketAddr: string; side: Side; exitPrice: number }
  | { type: 'SETTLE_FUNDING'; markPrice: number; indexPrice: number }
  | { type: 'UPDATE_MARK_PRICE'; marketAddr: string; price: number }
  | { type: 'CLEAR_ERROR' };

function reducer(state: TraderState, action: Action): TraderState {
  const account = {
    ...state.account,
    positions: state.account.positions.map((p) => ({ ...p })),
  };
  const insuranceFund = { ...state.insuranceFund };
  const markPrices = new Map(state.markPrices);

  switch (action.type) {
    case 'DEPOSIT': {
      if (action.amount <= 0) return { ...state, error: 'Deposit amount must be positive' };
      account.collateralBalance += action.amount;
      return { ...state, account, error: null };
    }

    case 'WITHDRAW': {
      if (!canWithdraw(account, action.amount, markPrices)) {
        return { ...state, error: 'Insufficient balance or would breach margin requirements' };
      }
      account.collateralBalance -= action.amount;
      return { ...state, account, error: null };
    }

    case 'APPLY_FILL': {
      const { fill, feeBps, insuranceCutBps } = action;

      // Deduct taker fee from trader's collateral
      const takerFee = fill.fee;
      account.collateralBalance -= takerFee;

      // Route portion to insurance fund
      routeFeeToInsurance(fill, insuranceCutBps, insuranceFund);

      // Update positions (the matching engine's applyFillToPositions mutates accounts
      // but here we handle it in state)
      const existingPos = account.positions.find(
        (p) => p.market === 'SOL-PERP' && p.side === fill.side
      );

      if (existingPos) {
        const totalSize = existingPos.size + fill.size;
        existingPos.entryPrice =
          (existingPos.entryPrice * existingPos.size + fill.price * fill.size) / totalSize;
        existingPos.size = totalSize;
      } else {
        account.positions.push({
          market: 'SOL-PERP',
          side: fill.side,
          size: fill.size,
          entryPrice: fill.price,
          marginAllocated: fill.size * fill.price * feeBps / 10000,
          unrealizedPnl: 0,
        });
      }

      return { ...state, account, insuranceFund, error: null };
    }

    case 'CLOSE_POSITION': {
      const pos = account.positions.find(
        (p) => p.market === action.marketAddr && p.side === action.side
      );
      if (!pos) return { ...state, error: 'Position not found' };

      settlePnl(pos, action.exitPrice, account);
      return { ...state, account, error: null };
    }

    case 'SETTLE_FUNDING': {
      const rate = computeFundingRate(action.markPrice, action.indexPrice);
      for (const pos of account.positions) {
        if (pos.market === 'SOL-PERP') {
          applyFunding(pos, rate);
        }
      }
      return { ...state, account, error: null };
    }

    case 'UPDATE_MARK_PRICE': {
      markPrices.set(action.marketAddr, action.price);
      // Refresh unrealized PnL on each position
      for (const pos of account.positions) {
        if (pos.market === action.marketAddr) {
          pos.unrealizedPnl = calculateUnrealizedPnl(pos, action.price);
        }
      }
      return { ...state, account, markPrices, error: null };
    }

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────────

interface TraderContextValue {
  state: TraderState;
  deposit: (amount: number) => void;
  withdraw: (amount: number) => void;
  applyFill: (fill: Fill, feeBps: number, insuranceCutBps: number) => void;
  closePosition: (marketAddr: string, side: Side, exitPrice: number) => void;
  settleFunding: (markPrice: number, indexPrice: number) => void;
  updateMarkPrice: (marketAddr: string, price: number) => void;
}

const TraderContext = createContext<TraderContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────

export function TraderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

  const deposit = useCallback((amount: number) => {
    dispatch({ type: 'DEPOSIT', amount });
  }, []);

  const withdraw = useCallback((amount: number) => {
    dispatch({ type: 'WITHDRAW', amount });
  }, []);

  const applyFill = useCallback(
    (fill: Fill, feeBps: number, insuranceCutBps: number) => {
      dispatch({ type: 'APPLY_FILL', fill, feeBps, insuranceCutBps });
    },
    []
  );

  const closePosition = useCallback(
    (marketAddr: string, side: Side, exitPrice: number) => {
      dispatch({ type: 'CLOSE_POSITION', marketAddr, side, exitPrice });
    },
    []
  );

  const settleFunding = useCallback(
    (markPrice: number, indexPrice: number) => {
      dispatch({ type: 'SETTLE_FUNDING', markPrice, indexPrice });
    },
    []
  );

  const updateMarkPrice = useCallback((marketAddr: string, price: number) => {
    dispatch({ type: 'UPDATE_MARK_PRICE', marketAddr, price });
  }, []);

  return (
    <TraderContext.Provider
      value={{
        state,
        deposit,
        withdraw,
        applyFill,
        closePosition,
        settleFunding,
        updateMarkPrice,
      }}
    >
      {children}
    </TraderContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useTraderStore() {
  const ctx = useContext(TraderContext);
  if (!ctx) throw new Error('useTraderStore must be used inside <TraderProvider>');
  return ctx;
}

'use client';

// ============================================================================
// Hook: useTraderAccount
// Returns trader account state with derived metrics.
// ============================================================================

import { useMemo } from 'react';
import { useTraderStore } from '@/lib/store/trader-store';
import {
  totalUnrealizedPnl,
  marginHealth,
  BPS_DENOMINATOR,
} from '@/lib/engine';

export function useTraderAccount() {
  const { state, deposit, withdraw } = useTraderStore();
  const { account, markPrices, loading, error } = state;

  const totalPnl = useMemo(
    () => totalUnrealizedPnl(account, markPrices),
    [account, markPrices]
  );

  const totalNotional = useMemo(
    () =>
      account.positions.reduce((sum, pos) => {
        const price = markPrices.get(pos.market) ?? pos.entryPrice;
        return sum + pos.size * price;
      }, 0),
    [account.positions, markPrices]
  );

  const healthBps = useMemo(
    () => marginHealth(account.collateralBalance, totalPnl, totalNotional),
    [account.collateralBalance, totalPnl, totalNotional]
  );

  // Health as a 0–100 percentage for UI display (capped at 100%)
  const healthPct = Math.min(100, Math.max(0, (healthBps / BPS_DENOMINATOR) * 100));

  return {
    account,
    positions: account.positions,
    collateralBalance: account.collateralBalance,
    totalUnrealizedPnl: totalPnl,
    totalNotional,
    healthBps,
    healthPct,
    loading,
    error,
    deposit,
    withdraw,
  };
}

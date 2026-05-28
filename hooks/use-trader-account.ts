'use client';

// ============================================================================
// Hook: useTraderAccount
// Returns trader account state with derived metrics.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTraderStore } from '@/lib/store/trader-store';
import { calculateUnrealizedPnl, marginHealth, totalUnrealizedPnl } from '@/engine/pkg/engine';
import { BPS_DENOMINATOR, Side, type Position, type TraderAccount } from '@/lib/types';
import { useSolanaContext } from '@/lib/solana/solana-context';
import { DEFAULT_MARKET_SYMBOL, DEFAULT_USDC_MINT } from '@/lib/solana/constants';
import { fromBaseUnits, fromPriceUnits, toUsdcUnits } from '@/lib/solana/conversions';
import { marketPda, positionPda, traderPda } from '@/lib/solana/pdas';
import { ensureTraderAccount } from '@/lib/solana/trader';
import { getOrCreateAssociatedTokenAccount } from '@/lib/solana/token';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useMarket } from '@/hooks/use-market';

const REFRESH_MS = 4000;

export function useTraderAccount() {
  const { state, deposit, withdraw } = useTraderStore();
  const { account, markPrices, loading, error } = state;
  const solana = useSolanaContext();
  const { markPrice } = useMarket();
  const [onchainAccount, setOnchainAccount] = useState<TraderAccount | null>(null);
  const [onchainPositions, setOnchainPositions] = useState<Position[]>([]);
  const [onchainLoading, setOnchainLoading] = useState(false);
  const [onchainError, setOnchainError] = useState<string | null>(null);

  const useOnchain = Boolean(solana?.program && solana.wallet?.publicKey);

  const fetchOnchain = useCallback(async () => {
    if (!useOnchain || !solana?.program || !solana.wallet.publicKey) return;

    setOnchainLoading(true);
    try {
      const owner = solana.wallet.publicKey;
      const [marketKey] = marketPda(DEFAULT_MARKET_SYMBOL);
      const [traderAccountKey] = traderPda(owner);

      const traderAccount = await solana.program.account.traderAccount.fetchNullable(traderAccountKey);
      if (!traderAccount) {
        setOnchainAccount({ owner: owner.toBase58(), collateralBalance: 0, positions: [] });
        setOnchainPositions([]);
        setOnchainError('Trader account not initialized');
        return;
      }

      const [longKey] = positionPda(owner, marketKey, Side.Long);
      const [shortKey] = positionPda(owner, marketKey, Side.Short);
      const [longPosition, shortPosition] = await Promise.all([
        solana.program.account.position.fetchNullable(longKey),
        solana.program.account.position.fetchNullable(shortKey),
      ]);

      const positions: Position[] = [];

      if (longPosition) {
        const size = fromBaseUnits(longPosition.size);
        if (size > 0) {
          const entryPrice = fromPriceUnits(longPosition.entryPrice);
          const positionBase: Position = {
            market: DEFAULT_MARKET_SYMBOL,
            side: Side.Long,
            size,
            entryPrice,
            marginAllocated: fromBaseUnits(longPosition.marginAllocated),
            unrealizedPnl: 0,
          };
          const unrealizedPnl = calculateUnrealizedPnl(
            positionBase,
            markPrice > 0 ? markPrice : entryPrice
          );
          positions.push({ ...positionBase, unrealizedPnl });
        }
      }

      if (shortPosition) {
        const size = fromBaseUnits(shortPosition.size);
        if (size > 0) {
          const entryPrice = fromPriceUnits(shortPosition.entryPrice);
          const positionBase: Position = {
            market: DEFAULT_MARKET_SYMBOL,
            side: Side.Short,
            size,
            entryPrice,
            marginAllocated: fromBaseUnits(shortPosition.marginAllocated),
            unrealizedPnl: 0,
          };
          const unrealizedPnl = calculateUnrealizedPnl(
            positionBase,
            markPrice > 0 ? markPrice : entryPrice
          );
          positions.push({ ...positionBase, unrealizedPnl });
        }
      }

      const mapped: TraderAccount = {
        owner: owner.toBase58(),
        collateralBalance: fromBaseUnits(traderAccount.collateral),
        positions,
      };

      setOnchainAccount(mapped);
      setOnchainPositions(positions);
      setOnchainError(null);
    } catch (err) {
      setOnchainError((err as Error).message);
    } finally {
      setOnchainLoading(false);
    }
  }, [markPrice, solana, useOnchain]);

  useEffect(() => {
    if (!useOnchain) {
      setOnchainAccount(null);
      setOnchainPositions([]);
      setOnchainError(null);
      setOnchainLoading(false);
      return;
    }

    fetchOnchain();
    const timer = setInterval(fetchOnchain, REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchOnchain, useOnchain]);

  const totalPnl = useMemo(
    () =>
      useOnchain
        ? onchainPositions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0)
        : totalUnrealizedPnl(account, markPrices),
    [account, markPrices, onchainPositions, useOnchain]
  );

  const totalNotional = useMemo(
    () => {
      if (useOnchain) {
        return onchainPositions.reduce((sum, pos) => {
          const price = markPrice > 0 ? markPrice : pos.entryPrice;
          return sum + pos.size * price;
        }, 0);
      }

      return account.positions.reduce((sum, pos) => {
        const price = markPrices.get(pos.market) ?? pos.entryPrice;
        return sum + pos.size * price;
      }, 0);
    },
    [account.positions, markPrice, markPrices, onchainPositions, useOnchain]
  );

  const healthBps = useMemo(
    () => marginHealth((useOnchain ? onchainAccount?.collateralBalance : account.collateralBalance) ?? 0, totalPnl, totalNotional),
    [account.collateralBalance, onchainAccount?.collateralBalance, totalPnl, totalNotional, useOnchain]
  );

  // Health as a 0–100 percentage for UI display (capped at 100%)
  const healthPct = Math.min(100, Math.max(0, (healthBps / BPS_DENOMINATOR) * 100));

  const onchainDeposit = useCallback(
    async (amount: number) => {
      if (!useOnchain || !solana?.program || !solana.wallet.publicKey) {
        deposit(amount);
        return;
      }

      if (amount <= 0) return;

      try {
        setOnchainError(null);
        setOnchainLoading(true);
        const owner = solana.wallet.publicKey;
        const { exchange, traderAccount, traderVault } = await ensureTraderAccount({
          program: solana.program,
          owner,
        });
        const ownerTokenAccount = await getOrCreateAssociatedTokenAccount({
          connection: solana.connection,
          wallet: solana.wallet,
          mint: DEFAULT_USDC_MINT,
        });

        await solana.program.methods
          .depositCollateral(toUsdcUnits(amount))
          .accounts({
            owner,
            exchange,
            traderAccount,
            traderVault,
            ownerTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();

        await fetchOnchain();
      } catch (err) {
        setOnchainError((err as Error).message);
      } finally {
        setOnchainLoading(false);
      }
    },
    [deposit, fetchOnchain, solana, useOnchain]
  );

  const onchainWithdraw = useCallback(
    async (amount: number) => {
      if (!useOnchain || !solana?.program || !solana.wallet.publicKey) {
        withdraw(amount);
        return;
      }

      if (amount <= 0) return;

      try {
        setOnchainError(null);
        setOnchainLoading(true);
        const owner = solana.wallet.publicKey;
        const [marketKey] = marketPda(DEFAULT_MARKET_SYMBOL);
        const { exchange, traderAccount, traderVault } = await ensureTraderAccount({
          program: solana.program,
          owner,
        });
        const ownerTokenAccount = await getOrCreateAssociatedTokenAccount({
          connection: solana.connection,
          wallet: solana.wallet,
          mint: DEFAULT_USDC_MINT,
        });

        const [longKey] = positionPda(owner, marketKey, Side.Long);
        const [shortKey] = positionPda(owner, marketKey, Side.Short);
        const [longInfo, shortInfo] = await Promise.all([
          solana.connection.getAccountInfo(longKey),
          solana.connection.getAccountInfo(shortKey),
        ]);

        const accounts: Record<string, unknown> = {
          owner,
          market: marketKey,
          exchange,
          traderAccount,
          traderVault,
          ownerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        };

        if (longInfo) accounts.longPosition = longKey;
        if (shortInfo) accounts.shortPosition = shortKey;

        await solana.program.methods
          .withdrawCollateral(toUsdcUnits(amount))
          .accounts(accounts as never)
          .rpc();

        await fetchOnchain();
      } catch (err) {
        setOnchainError((err as Error).message);
      } finally {
        setOnchainLoading(false);
      }
    },
    [fetchOnchain, solana, useOnchain, withdraw]
  );

  const resolvedAccount = useOnchain
    ? onchainAccount ?? {
        owner: solana?.wallet?.publicKey?.toBase58() ?? 'unknown',
        collateralBalance: 0,
        positions: [],
      }
    : account;
  const resolvedPositions = useOnchain ? onchainPositions : account.positions;

  return {
    account: resolvedAccount,
    positions: resolvedPositions,
    collateralBalance: resolvedAccount.collateralBalance,
    totalUnrealizedPnl: totalPnl,
    totalNotional,
    healthBps,
    healthPct,
    loading: useOnchain ? onchainLoading : loading,
    error: useOnchain ? onchainError : error,
    deposit: onchainDeposit,
    withdraw: onchainWithdraw,
  };
}

'use client';

// ============================================================================
// Hook: usePlaceOrder
// Provides placeOrder action with live preview calculations.
// ============================================================================

import { useCallback, useState } from 'react';
import { SystemProgram, type PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { useMarketStore } from '@/lib/store/market-store';
import { useTraderStore } from '@/lib/store/trader-store';
import { requiredInitialMargin, liquidationPrice } from '@/engine/pkg/engine';
import { type Fill, Side, OrderType } from '@/lib/types';
import { useSolanaContext } from '@/lib/solana/solana-context';
import { DEFAULT_MARKET_SYMBOL, USE_ONCHAIN } from '@/lib/solana/constants';
import { decodeSide, encodeOrderType, encodeSide } from '@/lib/solana/anchor-utils';
import { fromBaseUnits, fromPriceUnits, toBaseUnits, toPriceUnits } from '@/lib/solana/conversions';
import { exchangePda, marketPda, orderPda, positionPda, traderPda } from '@/lib/solana/pdas';
import { ensureTraderAccount } from '@/lib/solana/trader';
import { useMarket } from '@/hooks/use-market';
import { useOrderBook } from '@/hooks/use-order-book';
import { useTraderAccount } from '@/hooks/use-trader-account';

const MAX_MAKERS = 6;

export interface PlaceOrderParams {
  side: Side;
  orderType: OrderType;
  price: number; // limit price (ignored for market orders)
  size: number;
  leverage: number;
}

export interface OrderPreview {
  notional: number;
  initialMargin: number;
  estimatedLiquidationPrice: number;
  estimatedFee: number;
}

export function usePlaceOrder() {
  const { state: marketState, placeOrder: placeMarketOrder } = useMarketStore();
  const { state: traderState, applyFill } = useTraderStore();
  const { collateralBalance } = useTraderAccount();
  const { market: onchainMarket } = useMarket();
  const { bestBid, bestAsk } = useOrderBook();
  const solana = useSolanaContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useOnchain = USE_ONCHAIN && Boolean(solana?.program && solana.wallet?.publicKey);
  const market = onchainMarket ?? marketState.market;

  const getOrderPreview = useCallback(
    (params: Pick<PlaceOrderParams, 'size' | 'price' | 'leverage' | 'side'>): OrderPreview => {
      const fallbackPrice = market.markPrice || market.indexPrice || params.price;
      const effectiveAsk = bestAsk > 0 && bestAsk !== Infinity ? bestAsk : market.bestAsk;
      const effectiveBid = bestBid > 0 ? bestBid : market.bestBid;
      const effectivePrice =
        params.price > 0
          ? params.price
          : params.side === Side.Long
          ? effectiveAsk > 0 && effectiveAsk !== Infinity
            ? effectiveAsk
            : fallbackPrice
          : effectiveBid > 0
          ? effectiveBid
          : fallbackPrice;

      const notional = params.size * effectivePrice;
      const initialMargin = requiredInitialMargin(notional, params.leverage);
      const estimatedLiquidationPrice = liquidationPrice(
        effectivePrice,
        params.side,
        500,
        params.leverage
      );
      const estimatedFee = (notional * market.feeBps) / 10000;

      return { notional, initialMargin, estimatedLiquidationPrice, estimatedFee };
    },
    [bestAsk, bestBid, market]
  );

  const buildMakerAccounts = useCallback(
    async (marketKey: PublicKey, takerSide: Side) => {
      if (!solana?.program || !solana.connection) return [];

      const oppositeSide = takerSide === Side.Long ? Side.Short : Side.Long;
      const orders = await solana.program.account.order.all([
        {
          memcmp: {
            offset: 8,
            bytes: marketKey.toBase58(),
          },
        },
      ]);

      const makers = orders
        .map(({ publicKey, account }) => ({
          publicKey,
          trader: account.trader,
          side: decodeSide(account.side),
          price: fromPriceUnits(account.price),
          size: fromBaseUnits(account.size),
        }))
        .filter((order) => order.size > 0 && order.side === oppositeSide)
        .sort((a, b) =>
          oppositeSide === Side.Short ? a.price - b.price : b.price - a.price
        )
        .slice(0, MAX_MAKERS);

      const remaining = [] as Array<{ pubkey: PublicKey; isSigner: boolean; isWritable: boolean }>;

      for (const maker of makers) {
        const [makerTrader] = traderPda(maker.trader);
        const [makerPosition] = positionPda(maker.trader, marketKey, oppositeSide);
        const makerPositionInfo = await solana.connection.getAccountInfo(makerPosition);
        if (!makerPositionInfo) continue;

        remaining.push(
          { pubkey: maker.publicKey, isSigner: false, isWritable: true },
          { pubkey: makerTrader, isSigner: false, isWritable: true },
          { pubkey: makerPosition, isSigner: false, isWritable: true }
        );
      }

      return remaining;
    },
    [solana]
  );

  const generateUniqueOrderId = useCallback(
    async (marketKey: PublicKey) => {
      if (!solana?.connection) throw new Error('Connection not available');

      for (let attempt = 0; attempt < 5; attempt += 1) {
        let value = new BN(Date.now());
        if (globalThis.crypto?.getRandomValues) {
          const buffer = new Uint32Array(2);
          globalThis.crypto.getRandomValues(buffer);
          value = new BN(buffer[0]).shln(32).add(new BN(buffer[1]));
        }

        const [candidate] = orderPda(marketKey, value);
        const info = await solana.connection.getAccountInfo(candidate);
        if (!info) return value;
      }

      throw new Error('Unable to generate a unique order id');
    },
    [solana?.connection]
  );

  const placeOrder = useCallback(
    async (params: PlaceOrderParams): Promise<boolean> => {
      setError(null);
      setLoading(true);

      try {
        const preview = getOrderPreview(params);

        if (preview.initialMargin > collateralBalance) {
          throw new Error(
            `Insufficient margin. Need $${preview.initialMargin.toFixed(2)}, have $${collateralBalance.toFixed(2)}`
          );
        }

        if (params.size <= 0) {
          throw new Error('Order size must be greater than zero');
        }

        if (!useOnchain || !solana?.program || !solana.wallet?.publicKey) {
          placeMarketOrder({
            trader: traderState.account.owner,
            side: params.side,
            orderType: params.orderType,
            price: params.price,
            size: params.size,
          });

          if (marketState.error) {
            throw new Error(marketState.error);
          }

          const fillPrice = params.side === Side.Long ? market.bestAsk : market.bestBid;
          const syntheticFill: Fill = {
            maker: 'order-book',
            taker: traderState.account.owner,
            price: fillPrice || params.price,
            size: params.size,
            fee: (params.size * (fillPrice || params.price) * market.feeBps) / 10000,
            side: params.side,
          };

          applyFill(syntheticFill, market.feeBps, market.insuranceFundCutBps);
          return true;
        }

        const owner = solana.wallet.publicKey;
        await ensureTraderAccount({ program: solana.program, owner });

        const [marketKey] = marketPda(DEFAULT_MARKET_SYMBOL);
        const [exchange] = exchangePda();
        const [takerAccount] = traderPda(owner);
        const [takerPosition] = positionPda(owner, marketKey, params.side);

        const marketAccount = await solana.program.account.market.fetch(marketKey);
        const nextOrderId = (marketAccount as { nextOrderId?: BN; next_order_id?: BN }).nextOrderId
          ?? (marketAccount as { next_order_id?: BN }).next_order_id
          ?? new BN(1);

        const orderId =
          params.orderType === OrderType.Limit
            ? nextOrderId
            : await generateUniqueOrderId(marketKey);

        const [restingOrder] = orderPda(marketKey, orderId);
        const remaining = await buildMakerAccounts(marketKey, params.side);

        await solana.program.methods
          .placeOrder(
            encodeSide(params.side),
            encodeOrderType(params.orderType),
            params.orderType === OrderType.Market ? new BN(0) : toPriceUnits(params.price),
            toBaseUnits(params.size),
            params.leverage,
            orderId
          )
          // @ts-ignore: Anchor auto-resolves some PDAs but we explicitly pass them
          .accounts({
            taker: owner,
            market: marketKey,
            exchange,
            takerAccount,
            takerPosition,
            restingOrder,
            systemProgram: SystemProgram.programId,
          } as any)
          .remainingAccounts(remaining)
          .rpc();

        return true;
      } catch (e) {
        setError((e as Error).message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      applyFill,
      buildMakerAccounts,
      collateralBalance,
      generateUniqueOrderId,
      getOrderPreview,
      market,
      marketState.error,
      placeMarketOrder,
      solana,
      traderState.account.owner,
      useOnchain,
    ]
  );

  return { placeOrder, getOrderPreview, loading, error };
}

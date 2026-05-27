'use client';

// ============================================================================
// Hook: usePlaceOrder
// Provides placeOrder action with live preview calculations.
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import { useMarketStore } from '@/lib/store/market-store';
import { useTraderStore } from '@/lib/store/trader-store';
import { requiredInitialMargin, liquidationPrice } from '@/engine/pkg/engine';
import { type Fill, Side, OrderType } from '@/lib/types';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { market } = marketState;
  const { account } = traderState;

  /**
   * Calculate a live preview of order parameters before submitting.
   */
  const getOrderPreview = useCallback(
    (params: Pick<PlaceOrderParams, 'size' | 'price' | 'leverage' | 'side'>): OrderPreview => {
      const effectivePrice =
        params.price > 0
          ? params.price
          : params.side === Side.Long
          ? market.bestAsk
          : market.bestBid;

      const notional = params.size * effectivePrice;
      const initialMargin = requiredInitialMargin(notional, params.leverage);
      const estimatedLiquidationPrice = liquidationPrice(
        effectivePrice,
        params.side,
        500, // 5% maintenance margin
        params.leverage
      );
      const estimatedFee = (notional * market.feeBps) / 10000;

      return { notional, initialMargin, estimatedLiquidationPrice, estimatedFee };
    },
    [market]
  );

  /**
   * Place an order: validates margin, dispatches to market store, updates trader store.
   */
  const placeOrder = useCallback(
    async (params: PlaceOrderParams): Promise<boolean> => {
      setError(null);
      setLoading(true);

      try {
        const preview = getOrderPreview(params);

        // Validate: check trader has enough free margin
        if (preview.initialMargin > account.collateralBalance) {
          throw new Error(
            `Insufficient margin. Need $${preview.initialMargin.toFixed(2)}, have $${account.collateralBalance.toFixed(2)}`
          );
        }

        if (params.size <= 0) {
          throw new Error('Order size must be greater than zero');
        }

        // Dispatch to market store (matching engine)
        placeMarketOrder({
          trader: account.owner,
          side: params.side,
          orderType: params.orderType,
          price: params.price,
          size: params.size,
        });

        // Check if the market store got an error (market orders can fail)
        if (marketState.error) {
          throw new Error(marketState.error);
        }

        // Build a synthetic fill for the trader store
        // (In reality we'd get fills back from the market store action)
        const fillPrice =
          params.side === Side.Long ? market.bestAsk : market.bestBid;
        const syntheticFill: Fill = {
          maker: 'order-book',
          taker: account.owner,
          price: fillPrice || params.price,
          size: params.size,
          fee: (params.size * (fillPrice || params.price) * market.feeBps) / 10000,
          side: params.side,
        };

        applyFill(syntheticFill, market.feeBps, market.insuranceFundCutBps);

        return true;
      } catch (e) {
        setError((e as Error).message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      account,
      market,
      marketState.error,
      placeMarketOrder,
      applyFill,
      getOrderPreview,
    ]
  );

  return { placeOrder, getOrderPreview, loading, error };
}

'use client';

import { useState, useMemo } from 'react';
import { usePlaceOrder } from '@/hooks/use-place-order';
import { useTraderAccount } from '@/hooks/use-trader-account';
import { Side, OrderType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PlaceOrderFormProps {
  className?: string;
}

export function PlaceOrderForm({ className }: PlaceOrderFormProps) {
  const { placeOrder, getOrderPreview, loading, error } = usePlaceOrder();
  const { collateralBalance } = useTraderAccount();

  const [side, setSide] = useState<Side>(Side.Long);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.Limit);
  const [price, setPrice] = useState('142.50');
  const [size, setSize] = useState('1');
  const [leverage, setLeverage] = useState(5);
  const [success, setSuccess] = useState(false);

  const numericPrice = parseFloat(price) || 0;
  const numericSize = parseFloat(size) || 0;

  const preview = useMemo(
    () =>
      getOrderPreview({
        side,
        size: numericSize,
        price: orderType === OrderType.Market ? 0 : numericPrice,
        leverage,
      }),
    [getOrderPreview, side, numericSize, numericPrice, orderType, leverage]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    const ok = await placeOrder({
      side,
      orderType,
      price: orderType === OrderType.Market ? 0 : numericPrice,
      size: numericSize,
      leverage,
    });

    if (ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-4 bg-surface-container-lowest border border-grid-line p-4', className)}
    >
      <div className="flex items-center justify-between border-b border-grid-line pb-3">
        <span className="font-label-mono text-label-mono text-xs text-on-surface-variant uppercase">
          [ PLACE_ORDER ]
        </span>
        <span className="font-label-mono text-xs text-terminal-gray">
          BAL: ${collateralBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Side toggle */}
      <div className="grid grid-cols-2 gap-px bg-grid-line">
        <button
          type="button"
          onClick={() => setSide(Side.Long)}
          className={cn(
            'py-2 font-label-mono text-label-mono text-xs uppercase transition-colors',
            side === Side.Long
              ? 'bg-[#00FF41] text-black'
              : 'bg-surface-container-lowest text-on-surface-variant hover:text-primary'
          )}
        >
          Long
        </button>
        <button
          type="button"
          onClick={() => setSide(Side.Short)}
          className={cn(
            'py-2 font-label-mono text-label-mono text-xs uppercase transition-colors',
            side === Side.Short
              ? 'bg-red-500 text-black'
              : 'bg-surface-container-lowest text-on-surface-variant hover:text-primary'
          )}
        >
          Short
        </button>
      </div>

      {/* Order type */}
      <div className="grid grid-cols-2 gap-px bg-grid-line">
        <button
          type="button"
          onClick={() => setOrderType(OrderType.Limit)}
          className={cn(
            'py-2 font-label-mono text-xs uppercase transition-colors',
            orderType === OrderType.Limit
              ? 'bg-vault-blue text-white'
              : 'bg-surface-container-lowest text-on-surface-variant hover:text-primary'
          )}
        >
          Limit
        </button>
        <button
          type="button"
          onClick={() => setOrderType(OrderType.Market)}
          className={cn(
            'py-2 font-label-mono text-xs uppercase transition-colors',
            orderType === OrderType.Market
              ? 'bg-vault-blue text-white'
              : 'bg-surface-container-lowest text-on-surface-variant hover:text-primary'
          )}
        >
          Market
        </button>
      </div>

      {/* Price */}
      <div className="flex flex-col gap-1">
        <label htmlFor="order-price" className="font-label-mono text-xs text-terminal-gray uppercase">
          Price (USD)
        </label>
        <input
          id="order-price"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={orderType === OrderType.Market}
          className="bg-background border border-grid-line px-3 py-2 font-label-mono text-sm text-on-surface disabled:opacity-50"
        />
      </div>

      {/* Size */}
      <div className="flex flex-col gap-1">
        <label htmlFor="order-size" className="font-label-mono text-xs text-terminal-gray uppercase">
          Size (SOL)
        </label>
        <input
          id="order-size"
          type="number"
          step="0.01"
          min="0"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="bg-background border border-grid-line px-3 py-2 font-label-mono text-sm text-on-surface"
        />
      </div>

      {/* Leverage */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between font-label-mono text-xs">
          <span className="text-terminal-gray uppercase">Leverage</span>
          <span className="text-primary">{leverage}x</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={leverage}
          onChange={(e) => setLeverage(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Live preview */}
      <div className="grid grid-cols-2 gap-px bg-grid-line font-label-mono text-xs">
        <div className="bg-background p-2 flex flex-col gap-1">
          <span className="text-terminal-gray uppercase">Notional</span>
          <span>${preview.notional.toFixed(2)}</span>
        </div>
        <div className="bg-background p-2 flex flex-col gap-1">
          <span className="text-terminal-gray uppercase">Init. Margin</span>
          <span>${preview.initialMargin.toFixed(2)}</span>
        </div>
        <div className="bg-background p-2 flex flex-col gap-1">
          <span className="text-terminal-gray uppercase">Est. Liq. Price</span>
          <span className="text-secondary">${preview.estimatedLiquidationPrice.toFixed(2)}</span>
        </div>
        <div className="bg-background p-2 flex flex-col gap-1">
          <span className="text-terminal-gray uppercase">Est. Fee</span>
          <span>${preview.estimatedFee.toFixed(4)}</span>
        </div>
      </div>

      {error && (
        <p className="font-label-mono text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="font-label-mono text-xs text-[#00FF41]" role="status">
          Order submitted successfully
        </p>
      )}

      <button
        type="submit"
        disabled={loading || numericSize <= 0}
        className={cn(
          'w-full py-3 font-label-mono text-label-mono text-xs uppercase border transition-all disabled:opacity-50',
          side === Side.Long
            ? 'border-[#00FF41] text-[#00FF41] hover:bg-[#00FF41] hover:text-black'
            : 'border-red-500 text-red-400 hover:bg-red-500 hover:text-black'
        )}
      >
        {loading ? 'Submitting...' : `${side} ${orderType}`}
      </button>
    </form>
  );
}

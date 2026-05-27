import { renderHook, act } from '@testing-library/react';
import { MarketProvider, useMarketStore } from './market-store';
import { Side, OrderType } from '@/lib/types';

describe('MarketStore', () => {
  it('should initialize with a market', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MarketProvider>{children}</MarketProvider>
    );

    const { result } = renderHook(() => useMarketStore(), { wrapper });

    expect(result.current.state.market).toBeDefined();
    expect(result.current.state.market.baseAsset).toBe('SOL');
    expect(result.current.state.market.quoteAsset).toBe('USD');
    expect(result.current.state.market.bids.length).toBeGreaterThan(0);
    expect(result.current.state.market.asks.length).toBeGreaterThan(0);
  });

  it('should place a limit order', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MarketProvider>{children}</MarketProvider>
    );

    const { result } = renderHook(() => useMarketStore(), { wrapper });
    const initialBidsLength = result.current.state.market.bids.length;

    act(() => {
      result.current.placeOrder({
        trader: 'test-trader',
        side: Side.Long,
        orderType: OrderType.Limit,
        price: 141.0,
        size: 5,
      });
    });

    expect(result.current.state.market.bids.length).toBe(initialBidsLength + 1);
    expect(result.current.state.error).toBeNull();
  });

  it('should cancel an order', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MarketProvider>{children}</MarketProvider>
    );

    const { result } = renderHook(() => useMarketStore(), { wrapper });

    const firstBid = result.current.state.market.bids[0];
    const initialBidsLength = result.current.state.market.bids.length;

    expect(firstBid).toBeDefined();

    act(() => {
      result.current.cancelOrder(firstBid!.id, Side.Long);
    });

    expect(result.current.state.market.bids.length).toBe(initialBidsLength - 1);
    expect(result.current.state.error).toBeNull();
  });

  it('should update prices', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MarketProvider>{children}</MarketProvider>
    );

    const { result } = renderHook(() => useMarketStore(), { wrapper });

    act(() => {
      result.current.updatePrices(145.0, 144.5);
    });

    expect(result.current.state.market.markPrice).toBe(145.0);
    expect(result.current.state.market.indexPrice).toBe(144.5);
  });
});

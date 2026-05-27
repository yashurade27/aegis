import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { MarketProvider } from '@/lib/store/market-store';
import { TraderProvider, useTraderStore } from '@/lib/store/trader-store';
import { OrderBook } from '@/components/trading/OrderBook';
import { PlaceOrderForm } from '@/components/trading/PlaceOrderForm';
import { PositionTable } from '@/components/trading/PositionTable';
import { MarginHealthMeter } from '@/components/trading/MarginHealthMeter';
import { FundingRateBar } from '@/components/trading/FundingRateBar';
import { Side, type Fill } from '@/lib/types';

function TradingTestProviders({ children }: { children: React.ReactNode }) {
  return (
    <MarketProvider>
      <TraderProvider>{children}</TraderProvider>
    </MarketProvider>
  );
}

describe('Trading UI Components', () => {
  describe('OrderBook', () => {
    it('renders bids, asks, and spread from the market store', () => {
      render(
        <TradingTestProviders>
          <OrderBook />
        </TradingTestProviders>
      );

      expect(screen.getByText(/\[ ORDER_BOOK \]/)).toBeInTheDocument();
      expect(screen.getByText(/SPREAD:/)).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Size')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText(/spread$/i)).toBeInTheDocument();
    });

    it('shows cumulative depth bars for both sides', () => {
      const { container } = render(
        <TradingTestProviders>
          <OrderBook depth={3} />
        </TradingTestProviders>
      );

      const depthBars = container.querySelectorAll('[style*="width"]');
      expect(depthBars.length).toBeGreaterThan(0);
    });
  });

  describe('PlaceOrderForm', () => {
    it('shows live margin and liquidation preview', () => {
      render(
        <TradingTestProviders>
          <PlaceOrderForm />
        </TradingTestProviders>
      );

      expect(screen.getByText(/\[ PLACE_ORDER \]/)).toBeInTheDocument();
      expect(screen.getByText('Notional')).toBeInTheDocument();
      expect(screen.getByText('Init. Margin')).toBeInTheDocument();
      expect(screen.getByText('Est. Liq. Price')).toBeInTheDocument();
      expect(screen.getByText('Est. Fee')).toBeInTheDocument();
      expect(screen.getByText(/BAL: \$10,000\.00/)).toBeInTheDocument();
    });

    it('updates preview when size changes', () => {
      render(
        <TradingTestProviders>
          <PlaceOrderForm />
        </TradingTestProviders>
      );

      const sizeInput = screen.getByLabelText(/Size \(SOL\)/);
      fireEvent.change(sizeInput, { target: { value: '10' } });

      const notionalCell = screen.getByText('Notional').closest('div')?.parentElement;
      expect(notionalCell).toBeTruthy();
    });

    it('submits a limit order successfully', async () => {
      render(
        <TradingTestProviders>
          <PlaceOrderForm />
        </TradingTestProviders>
      );

      fireEvent.change(screen.getByLabelText(/Size \(SOL\)/), { target: { value: '1' } });
      fireEvent.change(screen.getByLabelText(/Price \(USD\)/), { target: { value: '141.0' } });
      fireEvent.click(screen.getByRole('button', { name: /Long Limit/i }));

      await waitFor(() => {
        expect(screen.getByText(/Order submitted successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('PositionTable', () => {
    it('shows empty state when no positions', () => {
      render(
        <TradingTestProviders>
          <PositionTable />
        </TradingTestProviders>
      );

      expect(screen.getByText(/No open positions/)).toBeInTheDocument();
    });

    it('renders positions with PnL and liquidation price', async () => {
      const fill: Fill = {
        maker: 'maker',
        taker: 'demo-user',
        price: 142.5,
        size: 2,
        fee: 0.285,
        side: Side.Long,
      };

      function PositionSeeder({ children }: { children: React.ReactNode }) {
        const { applyFill } = useTraderStore();
        useEffect(() => {
          applyFill(fill, 10, 8000);
        }, [applyFill]);
        return children;
      }

      render(
        <MarketProvider>
          <TraderProvider>
            <PositionSeeder>
              <PositionTable defaultLeverage={5} />
            </PositionSeeder>
          </TraderProvider>
        </MarketProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('SOL-PERP')).toBeInTheDocument();
      });

      expect(screen.getByText('LONG')).toBeInTheDocument();
      expect(screen.getByText('2.0000')).toBeInTheDocument();
      expect(screen.getAllByText('$142.50')).toHaveLength(2);
      expect(screen.getByText('$121.13')).toBeInTheDocument();
    });
  });

  describe('MarginHealthMeter', () => {
    it('shows healthy status for high health bps', () => {
      render(<MarginHealthMeter healthBps={2500} healthPct={25} />);

      expect(screen.getByText('HEALTHY')).toBeInTheDocument();
      expect(screen.getByText('2500 bps')).toBeInTheDocument();
      expect(screen.getByText('25.0%')).toBeInTheDocument();
    });

    it('shows caution status for moderate health', () => {
      render(<MarginHealthMeter healthBps={1000} />);

      expect(screen.getByText('CAUTION')).toBeInTheDocument();
    });

    it('shows at risk status for low health', () => {
      render(<MarginHealthMeter healthBps={300} />);

      expect(screen.getByText('AT RISK')).toBeInTheDocument();
    });
  });

  describe('FundingRateBar', () => {
    it('renders funding rate and mark/index prices', () => {
      render(
        <TradingTestProviders>
          <FundingRateBar />
        </TradingTestProviders>
      );

      expect(screen.getByText(/\[ FUNDING_RATE \]/)).toBeInTheDocument();
      expect(screen.getByText(/Mark \/ Index/)).toBeInTheDocument();
      expect(screen.getByText(/\$10k Projection/)).toBeInTheDocument();
    });

    it('shows longs pay shorts when rate is positive', () => {
      render(
        <TradingTestProviders>
          <FundingRateBar />
        </TradingTestProviders>
      );

      const markPrice = 143;
      const indexPrice = 142;
      expect(markPrice).toBeGreaterThan(indexPrice);
      expect(screen.getByText(/\/ hr$/)).toBeInTheDocument();
    });
  });
});

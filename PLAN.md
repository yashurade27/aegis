# SolPerps — On-Chain Perpetuals DEX Implementation Plan

## Section: Setup & Scaffolding
- Instantiate Anchor project (`anchor init solperps`)
- Define program IDL structure (`programs/solperps/src/lib.rs`)
- Define account structs in `programs/solperps/src/state.rs`: `Market`, `TraderAccount`, `Position`, `Order`
- Setup localnet validator with Pyth mock oracle (`solana-test-validator --account ...`)
- Configure `Anchor.toml` for localnet and devnet; set provider cluster

## Section: Core Data Structures
- `Market`: `pubkey`, `base_asset`, `quote_asset`, `bids: [Order; 200]`, `asks: [Order; 200]`, `best_bid`, `best_ask`, `open_interest`, `pyth_price_feed`
- `TraderAccount`: `owner: Pubkey`, `collateral_balance: u64`, `positions: Vec<Position>`
- `Position`: `market: Pubkey`, `side: Side`, `size: u64`, `entry_price: u64`, `margin_allocated: u64`, `unrealized_pnl: i64`
- `Order`: `id: u64`, `trader: Pubkey`, `side: Side`, `price: u64`, `size: u64`, `timestamp: i64`
- Implement serialization/deserialization logic; use `zero_copy` if accounts hit sizing limits (e.g., 10KB)

## Section: Matching Engine
- `fn match_order(market: &mut Market, taker_order: &mut Order) -> Vec<Fill>` — returns list of fills
- Iterate bids/asks from best price; match until order is fully filled or book is exhausted
- `struct Fill { maker: Pubkey, taker: Pubkey, price: u64, size: u64, fee: u64 }`
- Apply each fill: update maker's position, update taker's position, deduct margin from both, update open interest on Market
- Partial fill: reduce `remaining_size` on incoming order; if > 0, insert into book as resting limit
- Market order: fill at best available price; if book too thin, reject with `InsufficientLiquidity` error
- Price-time priority: when inserting into sorted array, maintain sort by price descending (bids) / ascending (asks); ties broken by timestamp
- Fee: `fee = fill_size * fill_price * fee_bps / 10_000`; split: 80% to insurance fund contribution, 20% to protocol (configurable)
- After all fills: emit `TradeEvent` for each fill, update `market.best_bid` / `market.best_ask`

## Section: Funding Rate & PnL Settlement

### Funding Rate Calculation
- Implement `funding.rs` with `fn compute_funding_rate(mark: u64, index: u64) -> i64`
- Formula: `(mark - index) * FUNDING_FACTOR / index`; cap at ±75 bps per hour

### Funding Application
- `fn apply_funding(position: &mut Position, funding_rate: i64)`: longs pay when rate > 0, shorts pay when rate < 0

### PnL Settlement
- Implement `settle_pnl`: calculate diff between exit_price and entry_price, add/subtract from `collateral_balance`

## Section: Margin & Liquidations
- `fn required_initial_margin(notional: u64, leverage: u8) -> u64`
- `fn required_maintenance_margin(notional: u64) -> u64`
- `fn margin_health(collateral: u64, unrealized_pnl: i64, notional: u64) -> u64` — returns health in bps
- `fn liquidation_price(entry: u64, side: Side, maintenance_margin_bps: u64, leverage: u8) -> u64`
- `withdraw_collateral`: check that post-withdrawal health > initial margin; reject if not
- `place_order`: check trader has enough free margin before inserting order; lock margin
- `liquidate_position` instruction: Verify health < maintenance margin; if true, close position, penalize collateral, routing penalty to liquidator and insurance fund

## Section: Insurance Fund
- Define `InsuranceFund` PDA with USDC token account
- `initialize_exchange` seeds the insurance fund PDA and its token account
- Fee routing: on every fill, `fee * insurance_fund_cut_bps / 10_000` transferred to insurance fund token account
- `claim_insurance` instruction: program-signed transfer from insurance fund to cover bad debt; update `total_claimed`
- Admin withdraw: can only withdraw amount above a minimum buffer (e.g. 10,000 USDC)

## Section: Keeper Bots

### Setup
- Setup: ts-node, @coral-xyz/anchor, @pythnetwork/client, node-cron, dotenv; load keypair from KEEPER_KEYPAIR env var

### Funding Keeper
- Funding keeper: runs `0 * * * *` (every hour); fetches all Market PDAs; calls `settle_funding` for each; logs rate applied

### Liquidation Keeper
- Liquidation keeper: runs every 30 seconds; fetches all `TraderAccount` PDAs; computes health for each using latest Pyth price; calls `liquidate_position` for any with health < maintenance margin

### Mark Price Keeper
- Mark price keeper: listens to `best_bid` / `best_ask` changes; updates Pyth feed internally or triggers `update_mark_price` if needed (if stale > 60s old)
- All keepers: wrap RPC calls in try/catch; retry 3 times with 1s/2s/4s backoff; log errors with timestamp

## Section: Frontend

### Setup
- Setup: `npx create-next-app`, install `@solana/wallet-adapter-react`, `@coral-xyz/anchor`, `recharts`, `@pythnetwork/client`; configure `WalletProvider` in `layout.tsx`; import IDL; set `NEXT_PUBLIC_RPC_URL` and `NEXT_PUBLIC_PROGRAM_ID` in `.env.local`

### Pages
- `/` — Market list table: symbol, mark price, 24h change, funding rate, open interest; each row links to `/trade/[market]`
- `/trade/[market]` — Three-panel layout: left = OrderBook + PlaceOrderForm, center = price chart (simple line chart via recharts using polled mark prices), right = PositionTable + MarginHealthMeter
- `/portfolio` — Collateral balance, deposit/withdraw buttons, all positions, trade history table, total unrealized PnL
- `/markets` — Cards per market: mark price, index price, spread, funding rate (with direction arrow), OI long vs short bar

### Components
- `OrderBook`: props `{ bids: Order[], asks: Order[] }`; renders two tables color-coded red/green; shows cumulative size bars
- `PlaceOrderForm`: props `{ market }`; limit/market toggle; side (Long/Short) toggle; size input; leverage slider (1–10x); shows "margin required" and "liquidation price" preview that updates live as user types; submit calls `usePlaceOrder`
- `PositionTable`: props `{ positions: Position[] }`; shows entry price, mark price, unrealized PnL (color coded), liquidation price, close button
- `FundingRateBar`: shows current rate as % with direction, countdown to next funding (updates every second), last 8 funding payments as sparkline
- `MarginHealthMeter`: horizontal bar; green >20%, yellow 10–20%, red <10%

### Hooks
- `useMarket(address)` → `{ market: MarketAccount | null, loading, error }` — polls every 3s
- `useOrderBook(address)` → `{ bids: Order[], asks: Order[] }` — derived from market account, sorted
- `useTraderAccount()` → `{ account: TraderAccountData | null, loading }` — fetches PDA for connected wallet
- `usePlaceOrder()` → `{ placeOrder(params): Promise, loading, error }` — builds tx with correct accounts
- `useCancelOrder()` → `{ cancelOrder(orderId): Promise, loading }`
- `useClosePosition()` → `{ closePosition(marketIndex, side): Promise, loading }` — sends market order in opposite direction

## Section: Testing

### On-chain Tests (Anchor/Mocha)
- Initialize exchange and one market (SOL-PERP)
- Deposit collateral: verify TraderAccount balance updates
- Place limit order: verify order appears in market bids/asks
- Place opposing market order: verify fill occurs, positions opened for both traders, fees collected
- Partial fill: place large limit, small market order; verify partial fill and remainder on book
- Cancel order: verify order removed, margin returned
- Settle funding: fast-forward time, call settle_funding, verify PnL updated
- Liquidation: manipulate mark price to push a trader below maintenance margin; call liquidate_position; verify position closed, insurance fund debited if bad debt
- Withdraw collateral: attempt over-withdrawal (should fail with InsufficientMargin)

### Keeper Unit Tests
- Mock `Connection` and `Program`; test liquidation-keeper correctly identifies unhealthy accounts
- Test funding-keeper applies correct funding rate sign (long pays when mark > index)

### Frontend Tests
- `ScenarioCalculator` renders correct liquidation price for known inputs
- `PlaceOrderForm` disables submit when size = 0
- `MarginHealthMeter` shows red when health < 10%

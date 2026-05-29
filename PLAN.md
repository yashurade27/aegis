# SolPerps / Aegis Vault — Implementation Plan

## Status Overview

| Phase | Scope | Status |
|-------|--------|--------|
| 1 | Core Rust matching + risk engine (WASM) | ✅ Complete |
| 2 | Frontend WASM wiring + stores/hooks + simulator | ✅ Complete |
| 3 | Trading UI components (reusable widgets) | ✅ Complete |
| 4 | Solana / Anchor on-chain program | ✅ Complete |
| 5 | Wallet integration + keepers + deployment | 🔧 Mostly Complete (deploy remaining) |
| 6 | Demo polish — live local market, distinct vaults, keeper setup | ✅ Complete |

---

## ✅ Phase 1 — Core Engine Library (Rust + WASM)

Pure Rust business logic (zero external deps). This repo compiles it to WebAssembly and exposes a JS/TS API consumed by the frontend.

### Data Types (`engine/src/types.rs`)
- `Side`, `OrderType`, `Order`, `Fill`, `Position`, `Market`, `TraderAccount`, `InsuranceFund`
- Constants: `MAX_FUNDING_RATE_BPS = 75`, `DEFAULT_MAINTENANCE_MARGIN_BPS = 500`

### Matching Engine (`engine/src/matching.rs`)
- `match_order(market, takerOrder) → Fill[]` — price-time priority
- `insert_order_into_book` — sorted bids (desc) / asks (asc)
- `cancel_order` — removes resting order by ID
- Partial fills become resting limit orders
- Market orders throw `InsufficientLiquidity` if book is thin
- Fee: `size × price × feeBps / 10000`

### Margin System (`engine/src/margin.rs`)
- `required_initial_margin(notional, leverage)` → `notional / leverage`
- `required_maintenance_margin(notional)` → `notional × 5%`
- `margin_health(collateral, pnl, notional)` → health in bps
- `liquidation_price(entry, side, maintBps, leverage)` — long/short formulas
- `can_withdraw` — rejects if withdrawal breaches maintenance margin
- `is_liquidatable` — health < maintenance margin check

### Funding Rate (`engine/src/funding.rs`)
- `compute_funding_rate(mark, index)` — capped ±75 bps/hr
- `apply_funding(position, rate)` — longs pay when rate > 0, shorts receive

### PnL Settlement (`engine/src/pnl.rs`)
- `calculate_unrealized_pnl(position, markPrice)` — long/short aware
- `settle_pnl(position, exitPrice, account)` — closes position, returns margin
- `total_unrealized_pnl(account, markPrices)` — aggregate across all positions

### Insurance Fund (`engine/src/insurance.rs`)
- `route_fee_to_insurance(fill, cutBps, fund)` — routes fee portion to fund
- `claim_insurance(fund, amount)` — covers bad debt (partial if insufficient)
- `admin_withdraw` — only above minimum buffer ($10,000 default)

### Tests (`engine/src/`)
- Rust unit tests: **not yet ported** (no `cargo test` suite currently present in `engine/src/`).
- Frontend/WASM tests: implemented via Vitest (`lib/store/market-store.test.tsx`, `__tests__/integration.test.ts`) to validate the engine’s exported functions.

---

## ✅ Phase 2 — Frontend Data Layer

React Context stores and hooks wiring the UI to the engine.

### WASM initialization
- `components/WasmProvider.tsx` initializes the WASM engine on the client.
- Vitest bootstrap (`vitest.setup.ts`) initializes WASM for test runs.

### WASM interop detail
- Some engine return values come back as `Map` objects from WASM glue code.
- `lib/wasm-utils.ts` converts those `Map` structures into plain JS objects for React state/tests.

### Market Store (`lib/store/market-store.tsx`)
- React context + `useReducer` with a pre-seeded SOL-PERP book
- Actions: `PLACE_ORDER`, `CANCEL_ORDER`, `SETTLE_FUNDING`, `UPDATE_PRICES`
- Exports `useMarketStore()` hook

### Trader Store (`lib/store/trader-store.tsx`)
- Manages `TraderAccount` state: collateral, positions, insurance fund
- Actions: `DEPOSIT`, `WITHDRAW`, `APPLY_FILL`, `CLOSE_POSITION`, `SETTLE_FUNDING`, `UPDATE_MARK_PRICE`
- Exports `useTraderStore()` hook

### Hooks
- `useMarket(address?)` — mark price, index price, funding rate, OI
- `useOrderBook(address?)` — typed bid/ask entries with cumulative sizes and spread
- `useTraderAccount()` — account with `totalUnrealizedPnl`, `marginHealth`, `healthPct`
- `usePlaceOrder()` — `placeOrder(params)`, `getOrderPreview(params)`, loading/error

### Providers (`app/layout.tsx`)
- `<MarketProvider>` and `<TraderProvider>` wrap the entire app

### Simulator Page (`app/simulator/page.tsx`)
- Replaced hardcoded formulas with real engine calls:
  - `requiredInitialMargin`, `liquidationPrice`, `marginHealth`, `calculateUnrealizedPnl`, `computeFundingRate`
- Added: side toggle (Long/Short), collateral input, position size, live margin health color-coding.
- Note: this page is currently a scenario simulator; full trading widgets are planned in Phase 3.

---

## ✅ Phase 3 — Trading UI Components

Reusable widgets in `components/trading/`, composed on `/trade`.

- `<OrderBook>` — real bid/ask from `useOrderBook`, cumulative size depth bars
- `<PlaceOrderForm>` — live margin + liquidation preview from `usePlaceOrder`
- `<PositionTable>` — real PnL via engine, liquidation price column
- `<MarginHealthMeter>` — green/yellow/red based on `healthBps`
- `<FundingRateBar>` — funding rate bar + hourly projection on $10k notional
- Tests: `components/trading/__tests__/trading-components.test.tsx`

---

## ✅ Phase 4 — Solana / Anchor On-Chain Program

Anchor workspace in `project/solperps/`.

### Setup
- Anchor workspace with program `solperps` (`programs/solperps/src/lib.rs`)
- State accounts in `state.rs`: `Market`, `TraderAccount`, `Position`, `Order`, `Exchange`, `MockOracle`
- `Anchor.toml` configured for localnet + devnet
- Mock Pyth oracle (`initialize_oracle`, `update_oracle`) for localnet

### Instructions
- `initialize_exchange` — seeds insurance fund PDA + USDC token vault
- `create_market` — SOL-PERP, ETH-PERP markets
- `initialize_trader` + `deposit_collateral` / `withdraw_collateral`
- `place_order` — margin check → match makers (remaining accounts) → resting limit → `TradeEvent`
- `cancel_order` — remove order, unlock margin
- `settle_funding` — keeper-callable hourly funding
- `liquidate_position` — health check, close, penalty to insurance

### On-Chain Tests (Anchor/Mocha)
- `tests/solperps.ts` — exchange + markets, deposit/cancel, full fill, funding settlement
- Rust unit tests in `programs/solperps/src/math.rs`
- Run: `anchor test` (see `solperps/README.md`)

---

## ✅ / 🔧 Phase 5 — Wallet Integration, Keepers & Deployment

### ✅ Wallet Connect + Live RPC (Complete)
- Installed `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui`, `@coral-xyz/anchor`
- `components/SolanaProvider.tsx` wraps the app with `ConnectionProvider` → `WalletProvider` → `WalletModalProvider`
- `lib/solana/solana-context.ts` provides `useSolanaContext()` with connection, wallet, Anchor provider, and program
- `WalletMultiButton` in `Header.tsx` for wallet connect CTA
- **Removed** redundant "LAUNCH APP" button from header (was confusing next to wallet connect)

### ✅ On-Chain Data Hooks (Complete)
- `hooks/use-market.ts` — fetches `program.account.market.fetchNullable()` every 4s when wallet connected, falls back to WASM mock when disconnected
- `hooks/use-trader-account.ts` — fetches `traderAccount` + `position` PDAs on-chain, derives margin health, supports on-chain deposit/withdraw via `depositCollateral` / `withdrawCollateral` instructions
- `hooks/use-place-order.ts` — on-chain `place_order` instruction when wallet connected

### ✅ Price Chart on /trade (Complete)
- `components/trading/PriceChart.tsx` — recharts `AreaChart` polling mark price every 3s, rolling 100-point buffer
- Integrated as the centrepiece panel on `/trade` (replaces the old static market info panel)
- Shows live price, delta from session start, green/red color based on direction
- Matches Aegis dark terminal aesthetic

### ✅ Keeper Bots (Complete — 3 modules)
- `tools/keepers/funding-keeper.ts` (~50 lines) — calls `settle_funding` instruction hourly
- `tools/keepers/mark-price-keeper.ts` (~95 lines) — fetches real SOL/USD from Pyth devnet feed, calls `update_oracle` on-chain every 60s
- `tools/keepers/liquidation-keeper.ts` (~70 lines) — scans all Position PDAs via `getProgramAccounts`, checks collateral vs maintenance margin, calls `liquidate_position` for undercollateralized accounts every 30s
- `tools/keepers/run-keepers.ts` — thin orchestrator that starts all 3 keepers concurrently with graceful SIGINT shutdown
- Run with: `npm run keepers:start`

### ✅ Live Pyth Oracle Config (Complete)
- Pyth devnet SOL/USD feed address added to `.env` (`PYTH_SOL_USD_FEED=J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix`)
- `lib/solana/constants.ts` — added `PYTH_SOL_USD_FEED` constant
- `lib/solana/pdas.ts` — added `oraclePda(market)` helper for `["oracle", market]` seed
- **Note:** The Anchor program uses a `MockOracle` account with `update_oracle` instruction. The mark-price keeper feeds real Pyth data into it — no Anchor program changes needed.

### 🔜 Remaining

- [ ] **Devnet deployment** — `anchor deploy --provider.cluster devnet`, then `npm run keepers:setup` (initialize exchange + market + oracle)
- [ ] **Netlify frontend deployment** — `next build` + deploy via `netlify.toml` (already configured)
- [ ] **End-to-end testing** — connect Phantom wallet on devnet, deposit collateral, place a trade, verify keepers update mark price and settle funding
- [ ] **Rust unit tests** — port engine tests to `cargo test` suite in `engine/src/`

---

## ✅ Phase 6 — Demo Polish

### On-chain mode is now opt-in
Connecting a wallet no longer forces the UI into on-chain mode while the program
is undeployed (which made every market/order-book/position read back empty).
- `lib/solana/constants.ts` — added `USE_ONCHAIN` (driven by `NEXT_PUBLIC_USE_ONCHAIN`)
- `use-market`, `use-order-book`, `use-trader-account`, `use-place-order` now gate on `USE_ONCHAIN`
- Default = local WASM-engine "dummy market"; set `NEXT_PUBLIC_USE_ONCHAIN=true` after `keepers:setup`

### Live local market
- `components/MarketSimulator.tsx` — random-walks the mark/index price every 1.5s and jitters maker liquidity every 3s, mirroring the new price into the trader store so position PnL updates live
- `lib/store/market-store.tsx` — added `JITTER_BOOK` action + `jitterBook()`
- `/trade` price chart + order book are now live, and Long/Short opens positions against the seeded book

### Distinct vault pages (`/vault/[id]`)
- Per-vault content: rebalance events, strategy insight, capital-split ratio (conic-gradient pie), accent color, allocation — each vault now reads clearly differently
- `DEPOSIT` → `/deposit?vault=<id>`, `MANAGE` → `/trade` (valid `<Link>`s, no nested `<button>`)
- Live NAV chart keyed per vault

### Simulator graph
- `app/simulator/page.tsx` — replaced the hardcoded static SVG with a real recharts equity-curve `AreaChart` computed from the engine PnL across the time horizon, with a break-even reference line

### Button cleanup
- Removed the remaining `LAUNCH APP` / `READ DOCS` buttons from `/strategy`
- Landing CTA now links to the vault marketplace

### Keeper setup + resilience
- `tools/setup/init-exchange.ts` + `npm run keepers:setup` — idempotently airdrops the keeper wallet (devnet), verifies the USDC mint, and runs `initialize_exchange` → `create_market` → `initialize_oracle`
- `run-keepers.ts` — checks/airdrops the wallet balance on startup (fixes "Attempt to debit an account but found no record of a prior credit") and warns if the market isn't initialized
- `funding-keeper` / `mark-price-keeper` — now skip cleanly when the market/oracle don't exist yet instead of throwing opaque simulation errors

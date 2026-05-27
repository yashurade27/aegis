# SolPerps / Aegis Vault — Implementation Plan

## Status Overview

| Phase | Scope | Status |
|-------|--------|--------|
| 1 | Core Rust matching + risk engine (WASM) | ✅ Complete |
| 2 | Frontend WASM wiring + stores/hooks + simulator | ✅ Complete |
| 3 | Trading UI components (reusable widgets) | ✅ Complete |
| 4 | Solana / Anchor on-chain program | ✅ Complete |
| 5 | Wallet integration + deployment | 🔜 Planned |

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

## 🔜 Phase 5 — Wallet Integration & Deployment

- Install `@solana/wallet-adapter-react`, `@coral-xyz/anchor`
- Add `WalletProvider` to `layout.tsx`
- Replace mock stores with on-chain RPC calls (using IDL)
- Keeper bots (TypeScript): funding (hourly), liquidation (30s), mark price (60s stale guard)
- Devnet deployment via `anchor deploy --provider.cluster devnet`
- Netlify deployment for frontend

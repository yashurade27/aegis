# SolPerps / Aegis Vault — Implementation Plan

## Status Overview

| Phase | Name | Status |
|-------|------|--------|
| 1 | Core Engine Library | ✅ Complete |
| 2 | Frontend Data Layer | ✅ Complete |
| 3 | Trading UI Components | 🔜 Planned |
| 4 | Solana / Anchor On-Chain Program | 🔜 Planned |
| 5 | Wallet Integration & Deployment | 🔜 Planned |

---

## ✅ Phase 1 — Core Engine Library

Pure Rust business logic. Zero external dependencies. Configured via Cargo.

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
- Need to port tests to Rust (`cargo test`)
- Coverage: matching, margin, funding, pnl, insurance

---

## ✅ Phase 2 — Frontend Data Layer

React Context stores and hooks wiring the UI to the engine.

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
- Added: side toggle (Long/Short), collateral input, position size, live margin health color-coding

---

## 🔜 Phase 3 — Trading UI Components

- `<OrderBook>` with real bid/ask from `useOrderBook`, cumulative size bars
- `<PlaceOrderForm>` with live margin + liquidation preview from `usePlaceOrder`
- `<PositionTable>` with real PnL, liquidation price column
- `<MarginHealthMeter>` — green/yellow/red based on `healthBps`
- `<FundingRateBar>` — countdown to next period, sparkline

---

## 🔜 Phase 4 — Solana / Anchor On-Chain Program

### Setup
- `anchor init solperps` — creates Anchor workspace
- Define IDL in `programs/solperps/src/lib.rs`
- Define state accounts in `state.rs`: `Market`, `TraderAccount`, `Position`, `Order`
- Configure `Anchor.toml` for localnet + devnet
- Localnet validator with Pyth mock oracle

### Instructions
- `initialize_exchange` — seeds insurance fund PDA + token account
- `create_market` — create SOL-PERP, ETH-PERP markets
- `deposit_collateral` — transfer USDC into trader account PDA
- `place_order` — margin check → matching engine → emit `TradeEvent`
- `cancel_order` — remove order, unlock margin
- `settle_funding` — apply hourly funding to all positions (keeper-callable)
- `liquidate_position` — verify health < maint margin, close position, route penalty
- `withdraw_collateral` — post-withdrawal margin check

### On-Chain Tests (Anchor/Mocha)
- Initialize exchange + market
- Deposit collateral, place/cancel orders
- Full fill, partial fill, liquidation scenario
- Funding settlement with time-skip

---

## 🔜 Phase 5 — Wallet Integration & Deployment

- Install `@solana/wallet-adapter-react`, `@coral-xyz/anchor`
- Add `WalletProvider` to `layout.tsx`
- Replace mock stores with on-chain RPC calls (using IDL)
- Keeper bots (TypeScript): funding (hourly), liquidation (30s), mark price (60s stale guard)
- Devnet deployment via `anchor deploy --provider.cluster devnet`
- Netlify deployment for frontend

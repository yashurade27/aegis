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

Pure TypeScript business logic. Zero external dependencies. Fully tested via Vitest.

### Data Types (`lib/engine/types.ts`)
- `Side`, `OrderType`, `Order`, `Fill`, `Position`, `Market`, `TraderAccount`, `InsuranceFund`
- Constants: `MAX_FUNDING_RATE_BPS = 75`, `DEFAULT_MAINTENANCE_MARGIN_BPS = 500`

### Matching Engine (`lib/engine/matching.ts`)
- `matchOrder(market, takerOrder) → Fill[]` — price-time priority
- `insertOrderIntoBook` — sorted bids (desc) / asks (asc)
- `cancelOrder` — removes resting order by ID
- Partial fills become resting limit orders
- Market orders throw `InsufficientLiquidity` if book is thin
- Fee: `size × price × feeBps / 10000`

### Margin System (`lib/engine/margin.ts`)
- `requiredInitialMargin(notional, leverage)` → `notional / leverage`
- `requiredMaintenanceMargin(notional)` → `notional × 5%`
- `marginHealth(collateral, pnl, notional)` → health in bps
- `liquidationPrice(entry, side, maintBps, leverage)` — long/short formulas
- `canWithdraw` — rejects if withdrawal breaches maintenance margin
- `isLiquidatable` — health < maintenance margin check

### Funding Rate (`lib/engine/funding.ts`)
- `computeFundingRate(mark, index)` — capped ±75 bps/hr
- `applyFunding(position, rate)` — longs pay when rate > 0, shorts receive

### PnL Settlement (`lib/engine/pnl.ts`)
- `calculateUnrealizedPnl(position, markPrice)` — long/short aware
- `settlePnl(position, exitPrice, account)` — closes position, returns margin
- `totalUnrealizedPnl(account, markPrices)` — aggregate across all positions

### Insurance Fund (`lib/engine/insurance.ts`)
- `routeFeeToInsurance(fill, cutBps, fund)` — routes fee portion to fund
- `claimInsurance(fund, amount)` — covers bad debt (partial if insufficient)
- `adminWithdraw` — only above minimum buffer ($10,000 default)

### Tests (`lib/engine/__tests__/`)
- **78 tests** across 5 suites — all passing ✅
- Coverage: matching (17), margin (24), funding (13), pnl (11), insurance (13)

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

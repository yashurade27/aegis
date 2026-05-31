# Aegis — Architecture

> Hybrid on-chain / off-chain perpetuals vault & trading platform on Solana.

---

## 1. High-Level System Overview

```mermaid
graph TB
    subgraph USER["👤 User / Browser"]
        WALLET["Phantom / Solflare Wallet"]
        BROWSER["Next.js Frontend<br/>(React + TailwindCSS)"]
    end

    subgraph ENGINE["⚙️ Rust WASM Engine (engine/)"]
        WASM_MOD["wasm.rs<br/>JS Bindings (wasm-bindgen)"]
        MATCHING["matching.rs<br/>Price-Time Priority"]
        MARGIN["margin.rs<br/>Initial / Maintenance Margin"]
        FUNDING["funding.rs<br/>Funding Rate ±75 bps/hr"]
        PNL["pnl.rs<br/>Unrealized & Settlement"]
        INSURANCE["insurance.rs<br/>Insurance Fund"]
        TYPES["types.rs<br/>Core Data Types"]
    end

    subgraph SOLANA["🔗 Solana On-Chain (solperps/)"]
        ANCHOR["Anchor Program<br/>(solperps)"]
        ACCOUNTS["PDA Accounts<br/>Exchange · Market · Trader<br/>Position · Order · MockOracle"]
        INSTRUCTIONS["11 Instructions"]
    end

    subgraph KEEPERS["🤖 Keeper Bots (tools/)"]
        FK["Funding Keeper<br/>(hourly)"]
        MPK["Mark-Price Keeper<br/>(60s, Pyth feed)"]
        LK["Liquidation Keeper<br/>(30s scan)"]
        SETUP["Init-Exchange Setup"]
    end

    BROWSER -- "Off-chain mode<br/>(WASM calls)" --> WASM_MOD
    BROWSER -- "On-chain mode<br/>(RPC txns)" --> ANCHOR
    WALLET -- "Sign transactions" --> ANCHOR
    WASM_MOD --> MATCHING
    WASM_MOD --> MARGIN
    WASM_MOD --> FUNDING
    WASM_MOD --> PNL
    WASM_MOD --> INSURANCE
    MATCHING --> TYPES
    MARGIN --> TYPES
    FUNDING --> TYPES
    PNL --> TYPES
    INSURANCE --> TYPES
    ANCHOR --> ACCOUNTS
    ANCHOR --> INSTRUCTIONS
    FK -- "settle_funding ix" --> ANCHOR
    MPK -- "update_oracle ix<br/>(Pyth SOL/USD)" --> ANCHOR
    LK -- "liquidate_position ix" --> ANCHOR
    SETUP -- "initialize_exchange<br/>create_market<br/>initialize_oracle" --> ANCHOR
```

---

## 2. Frontend Provider & Component Tree

```mermaid
graph TD
    subgraph LAYOUT["app/layout.tsx — Provider Stack"]
        SP["SolanaProvider<br/>(ConnectionProvider → WalletProvider → WalletModal)"]
        WP["WasmProvider<br/>(loads engine WASM module)"]
        MP["MarketProvider<br/>(market-store.tsx — useReducer)"]
        TP["TraderProvider<br/>(trader-store.tsx — useReducer)"]
        MS["MarketSimulator<br/>(random-walk prices + book jitter)"]
    end

    SP --> WP --> MP --> TP --> MS

    subgraph PAGES["Next.js Pages (app/)"]
        LP["/ — Landing Page"]
        TRADE["/trade — Trading Terminal"]
        VAULTS["/vaults — Vault Marketplace"]
        VAULT["/vault/[id] — Individual Vault"]
        DEPOSIT["/deposit — Deposit Flow"]
        STRAT["/strategy — Strategy Overview"]
        SIM["/simulator — Risk Simulator"]
    end

    TP --> LP
    TP --> TRADE
    TP --> VAULTS
    TP --> VAULT
    TP --> DEPOSIT
    TP --> STRAT
    TP --> SIM

    subgraph TRADING["components/trading/ — Reusable Widgets"]
        OB["OrderBook"]
        POF["PlaceOrderForm"]
        PT["PositionTable"]
        MHM["MarginHealthMeter"]
        FRB["FundingRateBar"]
        PC["PriceChart<br/>(Recharts AreaChart)"]
    end

    TRADE --> OB
    TRADE --> POF
    TRADE --> PT
    TRADE --> MHM
    TRADE --> FRB
    TRADE --> PC

    subgraph SHARED["Shared Components"]
        HEADER["Header.tsx<br/>(WalletMultiButton)"]
        FOOTER["Footer.tsx"]
        UI["components/ui/<br/>(shadcn/ui primitives)"]
    end
```

---

## 3. Data Layer — Stores & Hooks

```mermaid
flowchart LR
    subgraph ENGINE["WASM Engine (engine/pkg)"]
        E_CREATE["createMarket"]
        E_MATCH["matchOrder"]
        E_CANCEL["cancelOrder"]
        E_INSERT["insertOrderIntoBook"]
        E_MARGIN["requiredInitialMargin<br/>liquidationPrice<br/>marginHealth"]
        E_FUNDING["computeFundingRate<br/>applyFunding"]
        E_PNL["calculateUnrealizedPnl<br/>settlePnl<br/>totalUnrealizedPnl"]
        E_INS["routeFeeToInsurance<br/>createInsuranceFund"]
        E_WITHDRAW["canWithdraw"]
    end

    subgraph STORES["React Context Stores"]
        MKT_STORE["MarketStore<br/>Actions: PLACE_ORDER · CANCEL_ORDER<br/>SETTLE_FUNDING · UPDATE_PRICES · JITTER_BOOK"]
        TRADER_STORE["TraderStore<br/>Actions: DEPOSIT · WITHDRAW · APPLY_FILL<br/>CLOSE_POSITION · SETTLE_FUNDING · UPDATE_MARK_PRICE"]
    end

    subgraph HOOKS["Custom Hooks"]
        H_MKT["useMarket()<br/>mark/index price, funding, OI"]
        H_OB["useOrderBook()<br/>bid/ask entries, spread"]
        H_TA["useTraderAccount()<br/>PnL, marginHealth, healthPct"]
        H_PO["usePlaceOrder()<br/>placeOrder(), getOrderPreview()"]
    end

    subgraph SOLANA_LIB["lib/solana/"]
        CTX["solana-context.ts<br/>useSolanaContext()"]
        PDAS["pdas.ts<br/>exchangePda · marketPda · traderPda<br/>positionPda · orderPda · oraclePda"]
        CONST["constants.ts<br/>USE_ONCHAIN flag"]
    end

    E_CREATE --> MKT_STORE
    E_MATCH --> MKT_STORE
    E_CANCEL --> MKT_STORE
    E_INSERT --> MKT_STORE
    E_FUNDING --> MKT_STORE
    E_PNL --> TRADER_STORE
    E_MARGIN --> TRADER_STORE
    E_WITHDRAW --> TRADER_STORE
    E_INS --> TRADER_STORE

    MKT_STORE --> H_MKT
    MKT_STORE --> H_OB
    TRADER_STORE --> H_TA
    MKT_STORE --> H_PO
    TRADER_STORE --> H_PO

    CONST -- "USE_ONCHAIN=true" --> H_MKT
    CONST -- "USE_ONCHAIN=true" --> H_OB
    CONST -- "USE_ONCHAIN=true" --> H_TA
    CONST -- "USE_ONCHAIN=true" --> H_PO
    CTX --> H_MKT
    CTX --> H_TA
    CTX --> H_PO
    PDAS --> H_TA
    PDAS --> H_PO
```

---

## 4. Solana Anchor Program — Instructions & Accounts

```mermaid
graph TB
    subgraph STATE["On-Chain State Accounts (PDAs)"]
        EXCHANGE["Exchange<br/>admin · usdc_mint · insurance_vault<br/>insurance_balance · bump"]
        MARKET["Market<br/>symbol · mark/index_price · open_interest<br/>fee_bps · next_order_id · last_funding_ts"]
        TRADER["TraderAccount<br/>owner · collateral · locked_margin"]
        POSITION["Position<br/>trader · market · side · size<br/>entry_price · margin_allocated · unrealized_pnl"]
        ORDER["Order<br/>market · trader · order_id · side<br/>order_type · price · size · leverage"]
        ORACLE["MockOracle<br/>market · price · authority"]
    end

    subgraph IX["Instructions (11)"]
        IX1["initialize_exchange"]
        IX2["create_market"]
        IX3["initialize_trader"]
        IX4["deposit_collateral"]
        IX5["withdraw_collateral"]
        IX6["place_order"]
        IX7["cancel_order"]
        IX8["settle_funding"]
        IX9["liquidate_position"]
        IX10["initialize_oracle"]
        IX11["update_oracle"]
    end

    subgraph MATH["math.rs — Fixed-Point Arithmetic"]
        M1["margin_check()"]
        M2["compute_pnl()"]
        M3["compute_funding()"]
        M4["is_liquidatable()"]
    end

    IX1 --> EXCHANGE
    IX2 --> MARKET
    IX3 --> TRADER
    IX4 --> TRADER
    IX5 --> TRADER
    IX6 --> ORDER
    IX6 --> POSITION
    IX6 --> MARKET
    IX7 --> ORDER
    IX8 --> POSITION
    IX8 --> MARKET
    IX9 --> POSITION
    IX9 --> EXCHANGE
    IX10 --> ORACLE
    IX11 --> ORACLE

    IX6 --> M1
    IX5 --> M1
    IX9 --> M4
    IX8 --> M3
    IX6 --> M2
```

---

## 5. Dual-Mode Data Flow (Off-Chain vs On-Chain)

```mermaid
flowchart TB
    UI["Trading UI Components"]

    subgraph OFFCHAIN["Off-Chain Mode (default)"]
        direction TB
        SIM["MarketSimulator<br/>random-walk prices every 1.5s<br/>jitter book every 3s"]
        WASM["WASM Engine<br/>(in-browser)"]
        MKT_S["MarketStore"]
        TRD_S["TraderStore"]

        SIM -- "updatePrices()" --> MKT_S
        SIM -- "updateMarkPrice()" --> TRD_S
        SIM -- "jitterBook()" --> MKT_S
        MKT_S -- "matchOrder() / cancelOrder()" --> WASM
        TRD_S -- "calculateUnrealizedPnl() / marginHealth()" --> WASM
    end

    subgraph ONCHAIN["On-Chain Mode (USE_ONCHAIN=true)"]
        direction TB
        RPC["Solana RPC<br/>(devnet / localnet)"]
        PROG["Anchor Program<br/>(solperps)"]
        PYTH["Pyth Oracle Feed<br/>(SOL/USD)"]

        FK2["Funding Keeper<br/>(hourly)"]
        MPK2["Mark-Price Keeper<br/>(60s)"]
        LK2["Liquidation Keeper<br/>(30s)"]

        MPK2 -- "fetch price" --> PYTH
        MPK2 -- "update_oracle" --> PROG
        FK2 -- "settle_funding" --> PROG
        LK2 -- "liquidate_position" --> PROG
        PROG --> RPC
    end

    UI -- "USE_ONCHAIN=false" --> OFFCHAIN
    UI -- "USE_ONCHAIN=true" --> ONCHAIN
```

---

## 6. Deployment Topology

```mermaid
graph LR
    subgraph CLIENT["Client Tier"]
        NETLIFY["Netlify CDN<br/>(next build)"]
        WASM_B["WASM Engine Bundle<br/>(engine/pkg)"]
    end

    subgraph BLOCKCHAIN["Solana Devnet"]
        PROG_B["Anchor Program<br/>(AJ3heSpY...)"]
        PYTH_B["Pyth SOL/USD Feed<br/>(J83w4HKf...)"]
        PDAS_B["PDAs: Exchange · Market<br/>Trader · Position · Order · Oracle"]
    end

    subgraph OPS["Operations"]
        SETUP_B["keepers:setup<br/>(init-exchange.ts)"]
        KEEPERS_B["keepers:start<br/>(run-keepers.ts)<br/>3 concurrent bots"]
    end

    NETLIFY -- "Serves SPA + WASM" --> CLIENT
    NETLIFY -- "RPC calls<br/>(when USE_ONCHAIN=true)" --> BLOCKCHAIN
    SETUP_B -- "Airdrop SOL<br/>Initialize exchange/market/oracle" --> BLOCKCHAIN
    KEEPERS_B -- "Continuous maintenance<br/>Funding · Price · Liquidation" --> BLOCKCHAIN
```

---

## 7. Key Files Reference

| Layer | Path | Purpose |
|-------|------|---------|
| **Engine** | `engine/src/types.rs` | Core data types (Side, Order, Position, Market, etc.) |
| | `engine/src/matching.rs` | Price-time priority order matching |
| | `engine/src/margin.rs` | Initial/maintenance margin, liquidation price |
| | `engine/src/funding.rs` | Funding rate compute + apply (±75 bps cap) |
| | `engine/src/pnl.rs` | Unrealized PnL + settlement |
| | `engine/src/insurance.rs` | Insurance fund routing + claims |
| | `engine/src/wasm.rs` | 15 `wasm_bindgen` JS-exposed functions |
| **Frontend** | `app/layout.tsx` | Provider stack (Solana → WASM → Market → Trader) |
| | `components/SolanaProvider.tsx` | Wallet + Anchor program context |
| | `components/WasmProvider.tsx` | WASM engine initialization |
| | `components/MarketSimulator.tsx` | Off-chain price simulator |
| | `lib/store/market-store.tsx` | Market state (React Context + useReducer) |
| | `lib/store/trader-store.tsx` | Trader state (collateral, positions, PnL) |
| | `hooks/use-market.ts` | Market data hook (dual-mode) |
| | `hooks/use-order-book.ts` | Order book hook with depth |
| | `hooks/use-place-order.ts` | Order placement (WASM or on-chain) |
| | `hooks/use-trader-account.ts` | Trader account hook (dual-mode) |
| | `components/trading/*.tsx` | 6 reusable trading widgets |
| **Solana** | `solperps/programs/solperps/src/lib.rs` | Anchor entry point (11 instructions) |
| | `solperps/.../state.rs` | 6 account types (Exchange, Market, etc.) |
| | `solperps/.../math.rs` | Fixed-point margin/PnL/funding math |
| | `solperps/.../instructions/` | 11 instruction handlers |
| | `lib/solana/pdas.ts` | 7 PDA derivation helpers |
| | `lib/solana/constants.ts` | Program ID, USE_ONCHAIN flag, scales |
| | `lib/solana/solana-context.ts` | React context for Anchor provider |
| **Keepers** | `tools/keepers/funding-keeper.ts` | Hourly `settle_funding` calls |
| | `tools/keepers/mark-price-keeper.ts` | 60s Pyth → `update_oracle` |
| | `tools/keepers/liquidation-keeper.ts` | 30s liquidation scan |
| | `tools/keepers/run-keepers.ts` | Orchestrator with graceful shutdown |
| | `tools/setup/init-exchange.ts` | Idempotent devnet initialization |

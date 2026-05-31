# Aegis — SolPerps Vault

Aegis is a hybrid on-chain / off-chain perpetuals vault and trading UI. The repository contains:

- A pure-Rust matching & risk engine compiled to WebAssembly (`engine/`) used as the canonical off-chain simulator and local market implementation.
- A Next.js + React frontend (`app/`, `components/`) that uses the WASM engine in local mode and can optionally operate against an Anchor on-chain program.
- An Anchor Solana program implementing the exchange primitives (`solperps/`) for on-chain mode and keepers that run maintenance tasks.

This README explains architecture, developer setup, testing, and deployment end-to-end.

**Quick TL;DR**
- Local dev (WASM engine + frontend): `npm install` → `npm run dev` (see Requirements)
- Run on-chain locally: install Anchor + Solana CLI → `cd solperps` → `npm install` → `anchor build` → `anchor test` / `anchor localnet` flow
- Deploy to devnet: `anchor deploy --provider.cluster devnet` then run `npm run keepers:setup` and set `NEXT_PUBLIC_USE_ONCHAIN=true`

**Contents**
- Project overview
- Architecture & key components
- Requirements
- Local development (WASM + frontend)
- On-chain development (Anchor localnet & devnet)
- Keepers & background services
- Tests
- Deployment notes
- Helpful file references

## Project overview

High-level responsibilities:

- engine/: Rust matching engine and risk primitives. Compiles to WASM for use in the browser and as a canonical simulator.
- app/, components/: Next.js frontend, UI components, pages, and simulator.
- solperps/: Anchor program implementing exchange state & instructions for opt-in on-chain mode.
- tools/: keeper scripts and setup helpers to initialize the on-chain market and run background jobs.

## Architecture

- Off-chain mode (default): the frontend initializes the WASM engine via `components/WasmProvider.tsx` and runs a live local market simulator that powers the order book, chart, and position PnL.
- On-chain mode (opt-in): when `NEXT_PUBLIC_USE_ONCHAIN=true` and the Anchor program is deployed, the frontend uses `lib/solana/*` hooks to read/write on-chain PDAs and submit transactions. Keepers maintain funding and oracle state.

Key design principles:
- The Rust engine is the single source of truth for matching, margin calculations, funding, and PnL. WASM exposes a JS-friendly API consumed by stores/hooks.
- On-chain Anchor program mirrors the engine's math (fixed-point, 6-decimal scaling) to maintain deterministic behavior between modes.

## Requirements

- Node.js (>=18 recommended) and npm or pnpm
- Rust toolchain (for `engine/` and Anchor program builds)
- Solana CLI (for localnet / devnet workflows)
- Anchor (tested with Anchor v0.32.1 — see `solperps/README.md` for pinning)

Install quick links:

```bash
# Node
node -v

# Rust
rustup show

# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Anchor (example pinned binary)
curl -sL https://github.com/otter-sec/anchor/releases/download/v0.32.1/anchor-0.32.1-x86_64-unknown-linux-gnu -o /tmp/anchor && chmod +x /tmp/anchor
```

## Local development — frontend + WASM engine

1. Install JS deps

```bash
cd project
npm install
```

2. Build/compile the WASM engine (if working on engine Rust code)

```bash
cd engine
# build wasm via wasm-pack or the provided cargo build pipeline (project's build scripts may vary)
cargo build --release --target wasm32-unknown-unknown
# some projects also include a JS glue packaging step in engine/pkg
```

3. Run the frontend development server

```bash
cd project
npm run dev
# open http://localhost:3000
```

Notes:
- `components/WasmProvider.tsx` initializes the compiled WASM module in the browser. The app falls back to a seeded local market when no wallet/on-chain deployment is present.

## On-chain development & testing (Anchor)

The Anchor program lives in `solperps/`. Use Anchor localnet for iteration and `devnet` for integration.

Local test flow:

```bash
# ensure solana-test-validator is running (Anchor test will manage it for you)
cd project/solperps
npm install
# run the Anchor test suite (builds program, runs test validator, executes tests)
/tmp/anchor test
```

Manual localnet deploy (for interacting via frontend):

```bash
cd project/solperps
anchor build
anchor localnet -- program deploy flow (see Anchor docs)
# or use `anchor test --skip-local-validator` with a running validator
```

Devnet deploy notes:

- Before deploying to devnet, ensure program IDs and `Anchor.toml` are set correctly.
- Deploy: `anchor deploy --provider.cluster devnet` (may require anchored binary and config). After deploy, run the keeper setup script to initialize exchange & markets.

## Keepers & background tasks

Keepers run periodic maintenance (funding settlement, oracle updates, liquidations) and are located under `tools/keepers`.

Typical usage:

```bash
cd project
npm run keepers:setup    # idempotent initialization for devnet/local
npm run keepers:start    # start all keepers locally
```

Keepers are resilient: they skip if market/oracle are missing and will airdrop/verify balances on devnet when configured in setup.

## Tests

- Frontend unit/integration tests: `npm test` or `npm run test` (Vite + Vitest configuration). See `__tests__/integration.test.ts`.
- Anchor on-chain tests: from `project/solperps` run `/tmp/anchor test` (or `anchor test` if installed).
- Rust unit tests (engine): from workspace root `cargo test -p <engine-package>` or `cd engine && cargo test` if tests exist.

## Common environment variables

- `NEXT_PUBLIC_USE_ONCHAIN` — when `true` the frontend will use the on-chain program instead of the local WASM engine. Default: `false`.
- `PYTH_SOL_USD_FEED` — Pyth devnet feed address used by the mark-price keeper (see `lib/solana/constants.ts`).
- Anchor/Solana configs are read from standard `Anchor.toml` and Solana CLI `~/.config/solana` config.

## Deployment notes

- Frontend: `next build` then deploy via Netlify (see `netlify.toml`). Configure environment variables in Netlify UI, including `NEXT_PUBLIC_USE_ONCHAIN` if you intend to connect to devnet.
- On-chain: deploy Anchor program to devnet, then run `npm run keepers:setup` to initialize exchange + markets.

## Helpful file references

- Plan and high-level roadmap: [PLAN.md](PLAN.md)
- Anchor program and on-chain instructions: [solperps/README.md](solperps/README.md)
- WASM glue + compiled engine: [engine/pkg](engine/pkg) and [engine/src](engine/src)
- Frontend providers: [components/WasmProvider.tsx](components/WasmProvider.tsx) and [components/SolanaProvider.tsx](components/SolanaProvider.tsx)
- Keepers and setup: [tools/keepers](tools/keepers) and [tools/setup/init-exchange.ts](tools/setup/init-exchange.ts)

## Next steps I can help with

- Run the test suites (`npm test`, `anchor test`, `cargo test`) and report failures.
- Add CI workflow to run Vitest and Anchor tests on PRs.
- Create concise developer onboarding script to bootstrap a local dev environment.

If you'd like, I can now run the frontend tests and the Anchor test suite and report results. Tell me which to run first.

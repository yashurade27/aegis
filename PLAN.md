# PLAN

## Goal
Ship the initial Aegis Vault front-end with real vault data, wallet connectivity, and a clear path to on-chain integration.

## Done
- Next.js app scaffolded with Tailwind and global styles
- Layout metadata, fonts, and base theme in app layout
- Shared header and footer navigation
- Marketplace page with vault cards and routing
- Landing page with hero, how-it-works, scenario simulator, metrics, and strategy sections
- Deposit flow UI with multi-step review and confirmation screens
- Scenario simulator page with sliders and projection visuals
- Strategy overview page
- Vault detail pages (dynamic /vault/[id] and static /vaults/*)

## In Progress
- None (design-only UI is in place, data is static)

## Next Steps
### 1) Product data and components
- Centralize vault data into a single config or data module
- Extract reusable UI pieces (VaultCard, ScenarioCalculator, CapitalSplitBar, NavChart)
- Replace placeholder chart visuals with a real chart component and data

### 2) Wallet and transactions
- Add Solana wallet adapter provider to app layout
- Build connect wallet UI state in header
- Implement hooks: useVault, useUserPosition, useDeposit, useWithdraw
- Wire deposit and withdraw flows to real transactions

### 3) Data and state
- Add NAV history endpoint or mock API for charts
- Add loading, error, and empty states across pages
- Add toasts and confirmation UX for actions

### 4) On-chain integration (capstone path)
- Add Anchor program repo or subfolder with vault logic
- Wire CPI integrations for lending and perps
- Implement keeper bot for NAV updates and rebalancing

### 5) Quality and deployment
- Add README with setup and run steps
- Add basic tests for critical UI flows
- Verify Netlify deployment configuration

# SolPerps — Anchor On-Chain Program

Perpetuals exchange program for Aegis Vault (Phase 4).

## Program ID (localnet)

`AJ3heSpYpqgqMNvJ7L1W1W1RqZfDUixayyyvSedRGAAT`

## Instructions

| Instruction | Description |
|-------------|-------------|
| `initialize_exchange` | Admin seeds exchange + insurance USDC vault |
| `create_market` | Create SOL-PERP / ETH-PERP market PDAs |
| `initialize_trader` | Trader account + collateral vault PDA |
| `deposit_collateral` | SPL USDC deposit |
| `withdraw_collateral` | Withdraw with post-withdrawal margin check |
| `place_order` | Margin check, match makers (remaining accounts), resting limit |
| `cancel_order` | Remove resting order, unlock margin |
| `settle_funding` | Keeper applies hourly funding to positions |
| `liquidate_position` | Close underwater position, route penalty |
| `initialize_oracle` / `update_oracle` | Mock Pyth oracle for localnet |

## State accounts

`Exchange`, `Market`, `TraderAccount`, `Position`, `Order`, `MockOracle` — see `programs/solperps/src/state.rs`.

## Math

Fixed-point engine mirrors the WASM off-chain engine (`u64`, 6 decimal scale) in `programs/solperps/src/math.rs`.

## Test

Requires Solana CLI + Anchor 0.32.1:

```bash
# Install Anchor 0.32.1 binary (if needed)
curl -sL https://github.com/otter-sec/anchor/releases/download/v0.32.1/anchor-0.32.1-x86_64-unknown-linux-gnu -o /tmp/anchor && chmod +x /tmp/anchor

export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
cd project/solperps
npm install
/tmp/anchor test
```

Rust unit tests (math):

```bash
cargo test -p solperps
```

## Clusters

`Anchor.toml` configures **localnet** and **devnet** program IDs.

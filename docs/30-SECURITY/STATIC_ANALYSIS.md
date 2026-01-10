# cubixles_ — Static Analysis

Last updated: 2026-01-10

## Tools
- Slither (static analyzer)
- Solhint (linting)

## Config
- `contracts/slither.config.json` (excludes `naming-convention` to avoid renaming immutable ABI getters)
- `contracts/.solhint.json`

## Commands
```sh
cd contracts
npx solhint "src/**/*.sol"
```

```sh
slither . --config-file slither.config.json
```

## Related coverage gate
Coverage is enforced separately via:
```sh
npm run coverage:contracts
```

If `slither` is not on PATH, use a local venv:

```sh
python3 -m venv .venv-slither
. .venv-slither/bin/activate
python3 -m pip install slither-analyzer
python3 -m slither . --config-file slither.config.json
```

## Triage policy
- Any Slither finding must be fixed or documented in `docs/30-SECURITY/KNOWN_LIMITATIONS.md`.
- If an issue is accepted, include rationale and severity.

## Solhint suppressions
- `immutable-vars-naming` is disabled on immutable addresses that mirror on-chain constants
  (`LESS_TOKEN`, `BURN_ADDRESS`, `POOL_MANAGER`) to avoid renaming ABI getters.
- `gas-indexed-events` is suppressed where indexing would change event data layout for
  downstream consumers (`FixedMintPriceUpdated`, `WethSwept`).

## Slither status
Latest run: 2026-01-10 (`slither . --config-file slither.config.json`) — 0 findings; `naming-convention` excluded in config.

### Suppressions (intentional)
- `MintBlocker` receive/fallback intentionally locks ETH (inline suppression).
- `CubixlesMinter.LESS_TOKEN` zero-address check is suppressed to allow ETH-only deployments.

### Dependency findings (noise)
Slither may report issues inside OpenZeppelin and Uniswap v4 dependencies
(assembly usage, pragma-version mixing, dead code). These are treated as dependency noise and
not modified locally.

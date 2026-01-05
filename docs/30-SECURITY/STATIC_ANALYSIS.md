# cubixles_ — Static Analysis

Last updated: 2026-01-03

## Tools
- Slither (static analyzer)
- Solhint (linting)

## Config
- `contracts/slither.config.json`
- `contracts/.solhint.json`

## Commands
```sh
cd contracts
npx solhint "src/**/*.sol"
```

```sh
. .venv-slither/bin/activate
slither contracts
```

## Related coverage gate
Coverage is enforced separately via:
```sh
npm run coverage:contracts
```

If `slither` is not on PATH, activate the local venv:

```sh
. .venv-slither/bin/activate
slither .
```

## Triage policy
- Any Slither finding must be fixed or documented in `docs/30-SECURITY/KNOWN_LIMITATIONS.md`.
- If an issue is accepted, include rationale and severity.

## Slither status
Latest run: 2026-01-03 (`slither contracts`) — PASS (project findings are suppressed inline).

### Suppressed findings (intentional)
1. **Weak PRNG** — `CubixlesMinter._assignPaletteIndex`
   - Palette selection still mixes user commits with `blockhash`, and the inline `slither-disable` directive keeps this acceptable art-only randomness. The trade-off is documented in `docs/30-SECURITY/KNOWN_LIMITATIONS.md`.
2. **Unused return values** — `RoyaltySplitter._sqrtPriceLimit`, `_poolInitialized`
   - `POOL_MANAGER.getSlot0` exposes multiple slots, but only `sqrtPriceX96` feeds the swap logic. The remaining slots are intentionally ignored and suppressed so Slither focuses on actionable findings.
3. **Missing zero-address validation** — `CubixlesMinter.LESS_TOKEN`
   - Passing `address(0)` enables fixed-price mints without LESS snapshots; a targeted `slither-disable` keeps the check from firing while preserving the legacy mode.

### Dependency findings (noise)
Slither still reports issues inside OpenZeppelin and Uniswap v4 dependencies
(incorrect exponentiation/shift, divide-before-multiply, assembly usage, pragma-version
mixing, dead code, and naming conventions). These are treated as dependency noise and
not modified locally.

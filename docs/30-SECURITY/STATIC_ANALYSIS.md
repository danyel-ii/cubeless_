# cubixles_ — Static Analysis

Last updated: 2026-01-02

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
cd contracts
slither .
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

## Current findings (triaged)
Slither findings (8 total) grouped by category:
- **Weak PRNG**: palette selection uses blockhash-based randomness (intentional, documented; not used for value transfers).
- **Strict equality checks**: RoyaltySplitter `_send` flow depends on exact values; acceptable because it guards payout exactness.
- **Unused return values**: `POOL_MANAGER.getSlot0()` return values read for state checks; no state impact.
- **Naming convention**: immutable variable naming warnings (cosmetic).

Mitigation posture:
- Documented in `docs/30-SECURITY/KNOWN_LIMITATIONS.md`.
- Re-run Slither after any contract changes; escalate if new findings appear.

## Latest run notes (2026-01-02)
- `slither .` failed because `slither` is not available in the local venv.
- `npx solhint "src/**/*.sol"` returned 0 errors, 63 warnings (including legacy `src/icecube/*` import-path warnings).

# Dependency Management

Last updated: 2026-01-05

## Node/Frontend
- Dependencies are declared in `package.json`.
- Exact versions are locked in `package-lock.json`.
- `solhint` is pinned to an exact version for reproducible lint output.
- Update using `npm update` or explicit version bumps in PRs.

## Solidity/Foundry
- Foundry uses `foundry.toml` and `foundry.lock`.
- Solidity libraries are vendored under `contracts/lib`.

## Review process
- Dependency updates must be reviewed and tested.
- Security fixes should be prioritized.
- Dependabot security alerts/updates are enabled; treat high/critical alerts as release blockers.
- `npm audit --audit-level=high` runs in CI.

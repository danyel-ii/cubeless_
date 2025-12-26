# cubeless — Fork Testing

## Purpose
Validate `ownerOf` and optional `royaltyInfo` behavior against real mainnet contracts.

## Requirements
- `MAINNET_RPC_URL` environment variable
- Optional `FORK_BLOCK_NUMBER` (defaults to pinned block in test)

## Command
```sh
npm run fork-test
```

## Notes
- Tests are skipped if `MAINNET_RPC_URL` is not set.
- Only read-only calls are used.

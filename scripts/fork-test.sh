#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${MAINNET_RPC_URL:-}" ]]; then
  echo "MAINNET_RPC_URL is required for fork tests" >&2
  exit 1
fi

cd contracts
forge test --match-path "test/fork/*" --fork-url "$MAINNET_RPC_URL" -vvv

#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

export CUBIXLES_CHAIN_ID=8453
export CUBIXLES_LESS_TOKEN=0x0000000000000000000000000000000000000000
export CUBIXLES_POOL_MANAGER=0x0000000000000000000000000000000000000000
export CUBIXLES_POOL_FEE=0
export CUBIXLES_POOL_TICK_SPACING=0
export CUBIXLES_POOL_HOOKS=0x0000000000000000000000000000000000000000
export CUBIXLES_SWAP_MAX_SLIPPAGE_BPS=0

cd "$REPO_ROOT/contracts"
exec forge script script/DeployCubixles.s.sol \
  --rpc-url "$BASE_RPC_URL" \
  --private-key "$BASE_DEPLOYER_KEY" \
  "$@"

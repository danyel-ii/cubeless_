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

export CUBIXLES_CHAIN_ID=1
export CUBIXLES_LESS_TOKEN=0x9C2CA573009F181EAc634C4d6e44A0977C24f335

cd "$REPO_ROOT/contracts"
exec forge script script/DeployCubixles.s.sol \
  --rpc-url "$MAINNET_RPC_URL" \
  --private-key "$MAINNET_DEPLOYER_KEY" \
  "$@"

#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
NETWORK_ENV_FILE="$REPO_ROOT/.env.mainnet"

load_env_file() {
  local env_file="$1"
  if [ -f "$env_file" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi
}

load_env_file "$ENV_FILE"
load_env_file "$NETWORK_ENV_FILE"

: "${MAINNET_RPC_URL:?MAINNET_RPC_URL is required}"
: "${MAINNET_DEPLOYER_KEY:?MAINNET_DEPLOYER_KEY is required}"
: "${CUBIXLES_CHAIN_ID:?CUBIXLES_CHAIN_ID is required}"
: "${CUBIXLES_LESS_TOKEN:?CUBIXLES_LESS_TOKEN is required}"

cd "$REPO_ROOT/contracts"
exec forge script script/DeployCubixles.s.sol \
  --rpc-url "$MAINNET_RPC_URL" \
  --private-key "$MAINNET_DEPLOYER_KEY" \
  "$@"

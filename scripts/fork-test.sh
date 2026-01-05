#!/usr/bin/env bash
# ensure a short path to avoid Unix socket length limits
set -euo pipefail

FORK_RPC_URL="${FORK_RPC_URL:-${MAINNET_RPC_URL:-}}"

if [[ -z "${FORK_RPC_URL}" ]]; then
  echo "FORK_RPC_URL (or MAINNET_RPC_URL) is required for fork tests" >&2
  exit 1
fi

temp_dir=$(mktemp -d "/tmp/cubixles-contracts.XXXXXX")
cleanup() {
  rm -rf "${temp_dir}"
}
trap cleanup EXIT

ln -s "${PWD}/contracts" "${temp_dir}/contracts"
cd "${temp_dir}/contracts"
forge test --match-path "test/fork/*" --fork-url "${FORK_RPC_URL}" -vvv

# cubeless — for_prod (Sepolia → Mainnet)

Last updated: 2025-12-27

## 0) Pre-flight (local)

1) Install deps
```sh
npm install
```

2) Run unit + API tests
```sh
npm test
```

3) Run contract tests
```sh
cd contracts
forge test -vvv
```

4) Run coverage + static analysis
```sh
npm run coverage:contracts
cd contracts
npx solhint "src/**/*.sol"
python3 -m slither .
```

5) Fork tests (release gate)
```sh
export MAINNET_RPC_URL="https://your-mainnet-rpc"
export FORK_BLOCK_NUMBER=19000000
export NO_PROXY="*"
export HTTP_PROXY=""
export HTTPS_PROXY=""
npm run fork-test
```

## 1) Sepolia deploy (contracts)

### Required env (local)
- `ICECUBE_OWNER`
- `ICECUBE_LESS_TOKEN` (optional, defaults to mainnet $LESS address)
- `ICECUBE_BURN_ADDRESS` (optional, defaults to `0x000000000000000000000000000000000000dEaD`)
- `ICECUBE_POOL_MANAGER` (optional, leave unset for no-swap mode)
- `ICECUBE_POOL_FEE` (optional, defaults to 0)
- `ICECUBE_POOL_TICK_SPACING` (required if pool manager is set)
- `ICECUBE_POOL_HOOKS` (optional, defaults to `0x0000000000000000000000000000000000000000`)
- `ICECUBE_SWAP_MAX_SLIPPAGE_BPS` (optional, defaults to 0; max 1000)
- `ICECUBE_RESALE_BPS` (optional, defaults to 500)

### Deploy
```sh
cd contracts
forge script script/DeployIceCube.s.sol \
  --rpc-url "$SEPOLIA_RPC_URL" \
  --private-key "$SEPOLIA_DEPLOYER_KEY" \
  --broadcast
```

### Export ABI
```sh
node contracts/scripts/export-abi.mjs
```

### Update frontend contract config
- Update `app/_client/src/config/contracts.ts` with Sepolia address if needed.
- Confirm `ICECUBE_CONTRACT.address` matches deployment.

## 2) Sepolia app setup

### Server env (Vercel or local)
- `PINATA_JWT`
- `ALCHEMY_API_KEY`
- `SERVER_AUTH_SALT`
- `ICECUBE_CONTRACT_ADDRESS`
- `ICECUBE_CHAIN_ID=11155111`

### Run dev + smoke
```sh
npm run dev
npm run test:ui
```

## 3) Sepolia mint flow (manual)

1) Open `http://127.0.0.1:3000`
2) Connect wallet on Sepolia.
3) Select 1–6 NFTs.
4) Click Mint.
5) Verify:
   - `tokenURI` resolves to `ipfs://<CID>`
   - metadata includes `animation_url` and `image`
   - `/m/<tokenId>` loads the correct cube
   - `royaltyInfo` returns splitter + 5% amount

## 4) Mainnet readiness checklist

1) Re-run all tests (unit + fuzz + invariants + fork).
2) Ensure `npm audit --json` shows 0 vulnerabilities.
3) Confirm no client keys in build:
```sh
npm run check:no-client-secrets
```
4) Update docs:
   - `docs/30-SECURITY/SECURITY_AUDIT.md`
   - `docs/60-STATUS/STATE_OF_REVIEW.md`
5) Verify Vercel env secrets are set (no `.env` on mainnet).
6) Set `ICECUBE_CHAIN_ID=1` and mainnet contract address in config.

## 5) Mainnet deploy (contracts)

1) Deploy on mainnet:
```sh
cd contracts
forge script script/DeployIceCube.s.sol \
  --rpc-url "$MAINNET_RPC_URL" \
  --private-key "$MAINNET_DEPLOYER_KEY" \
  --broadcast
```

2) Export ABI + update frontend config with mainnet address.
3) Record deployment:
   - `contracts/deployments/mainnet.json`
   - IceCubeMinter: `0xdd81D5A0F7e82978cf9Da0DD29c7C6cA4187ffd6`
   - RoyaltySplitter: `0x1BF35EC159fC3fD73D0EEc9BD52bBAA02FB76576`
   - Deploy txs:
     - `0xbb92ceb471132d2d29ed734e2a65a7ed290c15e2337b25d384c6989cc179f4b3`
     - `0x5d1732a7333610ed33dd2c22c49b45ff40fb9814a753f9a544d4db060f27a21e`
   - Ownership transfer (minter → splitter): completed (tx hash not recorded)

## 6) Mainnet launch validation

1) Mint 1 token with a known wallet.
2) Open `/m/<tokenId>` from a clean browser.
3) Verify:
   - `tokenURI` resolves
   - metadata fields are correct
   - token viewer renders
   - royalties route to splitter
   - $LESS swap output lands in the owner wallet

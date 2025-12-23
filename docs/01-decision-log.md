# Decision Log

## 2025-12-22 — T5 Spec Shapes

- v0 chain is Sepolia only (`chainId: 11155111`).
- `tokenId` stored as base-10 string (from `BigInt`) to allow large IDs.
- Mint gating accepts 1 to 6 referenced NFTs.
- `contractAddress` stored in EIP-55 checksum format.
- `tokenUri` + `image` store both `{ original, resolved }`.
- Provenance stores full `sourceMetadata.raw` JSON.

## 2025-12-23 — T13 Storage Decision (v0)

- Token URI is emitted as a data URI for fast iteration.
- A `tokenUriProvider` abstraction isolates the encoding step for future IPFS/Arweave.

## 2025-12-23 — Mint Economics (dev_tight)

- Mint price is fixed at `0.0027 ETH` with a `+10%` royalty.
- $Less buy is represented by a treasury placeholder (replace before production).

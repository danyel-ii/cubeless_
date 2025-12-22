# Decision Log

## 2025-12-22 — T5 Spec Shapes

- v0 chain is Sepolia only (`chainId: 11155111`).
- `tokenId` stored as base-10 string (from `BigInt`) to allow large IDs.
- `contractAddress` stored in EIP-55 checksum format.
- `tokenUri` + `image` store both `{ original, resolved }`.
- Provenance stores full `sourceMetadata.raw` JSON.

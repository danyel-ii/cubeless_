# Remaining Tasks (Owner Actions)

## Review Status

- Last reviewed: 2025-12-23
- Review status: Needs confirmation
- Owner: TBD

This list captures items still needed from you to complete v0.

## T14 — Direct Mint Call (Finish)

- Deploy `IceCubeMinter` to Sepolia and update `contracts/deployments/sepolia.json`.
- Export ABI to `contracts/abi/IceCubeMinter.json` (`node contracts/scripts/export-abi.mjs`).
- Verify the mint call in the UI:
  - Connect wallet on Sepolia
  - Select 1–6 NFTs
  - Mint transaction succeeds
  - Token URI decodes to metadata JSON with `animation_url` + provenance
  - Confirm $Less treasury placeholder address is set before production

## M1 — Manifest Finalization

- Update `/.well-known/farcaster.json`:
  - `accountAssociation.header`, `payload`, `signature`
  - `miniapp.homeUrl` (final)
  - `miniapp.iconUrl` (final)
  - confirm any remaining placeholder URLs/icons are replaced

## T13 — Storage Decision (Metadata)

- Pin the p5 miniapp build artifacts as an IPFS directory.
- Pin the metadata JSON (tokenURI) with `animation_url = ipfs://<appDirCID>/index.html`.
- Decide on a thumbnail capture flow (optional) and update `image`.
- Update `tokenUriProvider` to return the hosted `ipfs://<metaCID>` URL.

## Contract Ops

- (Optional) Etherscan verification for Sepolia deployment.
- Confirm treasury addresses:
  - Creator address
  - $Less treasury (placeholder for buy)
  - Resale splitter contract
- Confirm deploy script env vars:
  - `ICECUBE_CREATOR`
  - `ICECUBE_LESS_TREASURY`
  - `ICECUBE_RESALE_SPLITTER`

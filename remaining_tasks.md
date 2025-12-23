# Remaining Tasks (Owner Actions)

This list captures items still needed from you to complete v0.

## T14 — Direct Mint Call (Finish)

- Deploy `IceCubeMinter` to Sepolia and update `contracts/deployments/sepolia.json`.
- Export ABI to `contracts/abi/IceCubeMinter.json` (`node contracts/scripts/export-abi.mjs`).
- Verify the mint call in the UI:
  - Connect wallet on Sepolia
  - Select 1–6 NFTs
  - Mint transaction succeeds
  - Token URI decodes to metadata JSON with provenance

## M1 — Manifest Finalization

- Update `/.well-known/farcaster.json`:
  - `accountAssociation.header`, `payload`, `signature`
  - `miniapp.homeUrl` (final)
  - `miniapp.iconUrl` (final)
  - confirm any remaining placeholder URLs/icons are replaced

## T13 — Storage Decision (Metadata)

- Decide whether to keep data URI or move to IPFS/Arweave.
- If switching, define the upload flow and update `tokenUriProvider` to return remote URLs.

## Contract Ops

- (Optional) Etherscan verification for Sepolia deployment.
- Confirm treasury addresses:
  - Creator address
  - $Less treasury
  - $PNKSTR treasury
  - Pool treasury placeholder

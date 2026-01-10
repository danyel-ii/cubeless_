# Changelog

Last updated: 2026-01-10

All notable changes to this project will be documented in this file.

## [Unreleased]
- Deploy script now writes to `contracts/deployments/<chain>.json` by default (no override needed for dry runs).
- CSP telemetry endpoint and repo secret scan documented and enforced in CI.
- Next.js App Router migration with server-only `/api/*` routes.
- Deterministic tokenId (salt + canonical refs) with preview support.
- Commit metadata hashing (`metadataHash`, `imagePathHash`) required before mint.
- Token viewer route `/m/<tokenId>` and preview GIF metadata (added on pin when palette colors are available).
- Dynamic mint pricing based on $LESS supply with 0.0001 ETH rounding.
- Royalty splitter swap routing (25% ETH to owner, 25% swap to $LESS, 50% swap to $PNKSTR) with fallback to owner on failure.
- $LESS supply snapshot + delta metrics and leaderboard groundwork.
- Mainnet contracts redeployed under the cubixles_ name; deployment metadata refreshed.
- Etherscan verification submitted for CubixlesMinter + RoyaltySplitter.

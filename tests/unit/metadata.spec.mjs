import { describe, it, expect } from "vitest";
import { buildMintMetadata } from "../../app/_client/src/features/mint/mint-metadata.js";

describe("mint metadata builder", () => {
  it("includes required fields and provenance", () => {
    const selection = [
      {
        chainId: 11155111,
        contractAddress: "0x000000000000000000000000000000000000dEaD",
        tokenId: "42",
        name: "Test NFT",
        collectionName: "Test Collection",
        tokenUri: { original: "ipfs://token", resolved: "https://ipfs.io/ipfs/token" },
        image: { original: "ipfs://image", resolved: "https://ipfs.io/ipfs/image" },
        source: "alchemy",
        collectionFloorEth: 0.5,
        collectionFloorRetrievedAt: "2025-01-01T00:00:00.000Z",
      },
    ];
    const provenanceBundle = {
      chainId: 11155111,
      selectedBy: "0x000000000000000000000000000000000000dEaD",
      retrievedAt: "2025-01-01T00:00:00.000Z",
      nfts: [
        {
          chainId: 11155111,
          contractAddress: "0x000000000000000000000000000000000000dEaD",
          tokenId: "42",
          tokenUri: { original: "ipfs://token", resolved: "https://ipfs.io/ipfs/token" },
          image: { original: "ipfs://image", resolved: "https://ipfs.io/ipfs/image" },
          sourceMetadata: { raw: {} },
          retrievedVia: "alchemy",
          retrievedAt: "2025-01-01T00:00:00.000Z",
        },
      ],
    };

    const metadata = buildMintMetadata({
      tokenId: "123",
      minter: "0x000000000000000000000000000000000000dEaD",
      chainId: 11155111,
      selection,
      provenanceBundle,
      refsFaces: [
        { contractAddress: selection[0].contractAddress, tokenId: selection[0].tokenId },
      ],
      refsCanonical: [
        { contractAddress: selection[0].contractAddress, tokenId: selection[0].tokenId },
      ],
      salt: "0x" + "11".repeat(32),
      animationUrl: "https://example.com/m/123",
      imageUrl: "ipfs://cid/gif_0001.gif",
      gif: {
        variantIndex: 1,
        selectionSeed: "0x" + "22".repeat(32),
        params: {
          rgb_sep_px: 0,
          band_shift_px: 4,
          grain_intensity: 0.15,
          contrast_flicker: 0.05,
          solarization_strength: 0.25,
        },
        lessSupplyMint: "1000",
      },
    });

    expect(metadata.animation_url).toBe("https://example.com/m/123");
    expect(metadata.image).toBe("ipfs://cid/gif_0001.gif");
    expect(metadata.provenance.refsCanonical?.length).toBe(1);
    expect(metadata.attributes.length).toBe(6);
    const size = JSON.stringify(metadata).length;
    expect(size).toBeLessThan(50_000);
  });
});

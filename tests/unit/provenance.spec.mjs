import { describe, it, expect } from "vitest";
import {
  assertSepolia,
  parseTokenId,
  normalizeAddress,
  buildProvenanceBundle,
} from "../../app/_client/src/data/nft/indexer.ts";

describe("provenance shaping", () => {
  it("normalizes addresses and tokenIds", () => {
    expect(parseTokenId("0x10")).toBe("16");
    expect(parseTokenId("42")).toBe("42");
    expect(normalizeAddress("0x000000000000000000000000000000000000dead")).toBe(
      "0x000000000000000000000000000000000000dEaD"
    );
  });

  it("rejects non-Sepolia chainId", () => {
    expect(() => assertSepolia(1)).toThrow(/sepolia/i);
  });

  it("enforces selection bounds for provenance bundles", async () => {
    await expect(buildProvenanceBundle([], "0x000000000000000000000000000000000000dEaD", 11155111))
      .rejects.toThrow(/1 to 6/i);
    await expect(
      buildProvenanceBundle(
        new Array(7).fill(null).map((_, idx) => ({
          chainId: 11155111,
          contractAddress: "0x000000000000000000000000000000000000dEaD",
          tokenId: String(idx + 1),
          name: null,
          collectionName: null,
          tokenUri: null,
          image: null,
          source: "alchemy",
        })),
        "0x000000000000000000000000000000000000dEaD",
        11155111
      )
    ).rejects.toThrow(/1 to 6/i);
  });
});

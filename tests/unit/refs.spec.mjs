import { describe, it, expect } from "vitest";
import { sortRefsCanonically } from "../../app/_client/src/features/mint/refs.js";

describe("canonical ref ordering", () => {
  it("sorts refs by contract then tokenId", () => {
    const refs = [
      { contractAddress: "0x0000000000000000000000000000000000000002", tokenId: 2n },
      { contractAddress: "0x0000000000000000000000000000000000000001", tokenId: 9n },
      { contractAddress: "0x0000000000000000000000000000000000000001", tokenId: 1n },
    ];
    const sorted = sortRefsCanonically(refs);
    expect(sorted[0].contractAddress).toBe("0x0000000000000000000000000000000000000001");
    expect(sorted[0].tokenId).toBe(1n);
    expect(sorted[1].tokenId).toBe(9n);
    expect(sorted[2].contractAddress).toBe("0x0000000000000000000000000000000000000002");
  });
});

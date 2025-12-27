import { describe, it, expect } from "vitest";
import { formatSupply } from "../../app/_client/src/ui/hud/less-hud.js";
import { formatLess } from "../../app/_client/src/ui/hud/eth-hud.js";
import { formatDelta, shortenAddress } from "../../app/_client/src/ui/panels/leaderboard.js";

describe("HUD formatting", () => {
  it("formats $LESS supply for thresholds", () => {
    expect(formatSupply(null)).toBe("—");
    expect(formatSupply(999n * 1_000_000_000_000_000_000n)).toBe("999");
    expect(formatSupply(10_000n * 1_000_000_000_000_000_000n)).toMatch(/x10k/);
    expect(formatSupply(1_000_000n * 1_000_000_000_000_000_000n)).toMatch(/M$/);
  });

  it("formats ΔLESS values", () => {
    expect(formatLess(null)).toBe("—");
    expect(formatDelta(1_000_000_000_000_000_000n)).toBe("1.0000");
  });

  it("shortens addresses", () => {
    expect(shortenAddress("0x000000000000000000000000000000000000dEaD")).toMatch(/0x0000…dEaD/i);
  });
});

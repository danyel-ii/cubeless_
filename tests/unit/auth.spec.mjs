import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveRpcUrlForChain } from "../../src/server/auth.js";

const ORIGINAL_ENV = {
  MAINNET_RPC_URL: process.env.MAINNET_RPC_URL,
  BASE_RPC_URL: process.env.BASE_RPC_URL,
  SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL,
};

function setEnv(values) {
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
}

describe("resolveRpcUrlForChain", () => {
  beforeEach(() => {
    setEnv({
      MAINNET_RPC_URL: "https://mainnet.example",
      BASE_RPC_URL: "https://base.example",
      SEPOLIA_RPC_URL: "https://sepolia.example",
    });
  });

  afterEach(() => {
    setEnv(ORIGINAL_ENV);
  });

  it("returns mainnet RPC for chain id 1", () => {
    expect(resolveRpcUrlForChain(1)).toBe("https://mainnet.example");
  });

  it("returns base RPC for chain id 8453", () => {
    expect(resolveRpcUrlForChain(8453)).toBe("https://base.example");
  });

  it("returns sepolia RPC for chain id 11155111", () => {
    expect(resolveRpcUrlForChain(11155111)).toBe("https://sepolia.example");
  });

  it("returns null for unsupported chains", () => {
    expect(resolveRpcUrlForChain(10)).toBeNull();
  });
});

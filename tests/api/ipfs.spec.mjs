import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/server/ratelimit.js", () => ({
  checkRateLimit: vi.fn(async () => ({ ok: true })),
}));
vi.mock("../../src/server/request.js", () => ({
  getClientIp: () => "127.0.0.1",
  makeRequestId: () => "test-request-id",
}));
vi.mock("../../src/server/log.js", () => ({
  logRequest: vi.fn(),
}));

import { GET } from "../../app/api/ipfs/route.js";

describe("/api/ipfs", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => new Response("not found", { status: 404 }));
  });

  it("rejects missing url", async () => {
    const res = await GET(new Request("http://localhost/api/ipfs"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.requestId).toBe("test-request-id");
  });

  it("returns 429 when rate limited", async () => {
    const { checkRateLimit } = await import("../../src/server/ratelimit.js");
    checkRateLimit.mockResolvedValueOnce({ ok: false });
    const res = await GET(
      new Request("http://localhost/api/ipfs?url=ipfs://bafybeihash/asset.png")
    );
    expect(res.status).toBe(429);
  });

  it("returns 502 when gateways fail", async () => {
    const res = await GET(
      new Request("http://localhost/api/ipfs?url=ipfs://bafybeihash/asset.png")
    );
    expect(res.status).toBe(502);
  });

  it("returns gateway response on success", async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
    );
    const res = await GET(
      new Request("http://localhost/api/ipfs?url=ipfs://bafybeihash/manifest.json")
    );
    expect(res.status).toBe(200);
  });
});

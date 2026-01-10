import { parseIpfsUrl, buildGatewayUrls } from "../../../src/server/ipfs.js";
import { checkRateLimit } from "../../../src/server/ratelimit.js";
import { getClientIp, makeRequestId } from "../../../src/server/request.js";
import { logRequest } from "../../../src/server/log.js";

function looksLikeJson(text) {
  const trimmed = text.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

export async function GET(request) {
  const requestId = makeRequestId();
  const ip = getClientIp(request);
  const limit = await checkRateLimit(`ipfs:ip:${ip}`, { capacity: 30, refillPerSec: 1 });
  if (!limit.ok) {
    logRequest({ route: "/api/ipfs", status: 429, requestId, bodySize: 0 });
    return new Response(JSON.stringify({ error: "Rate limit exceeded", requestId }), {
      status: 429,
      headers: { "content-type": "application/json" },
    });
  }
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  if (!rawUrl) {
    logRequest({ route: "/api/ipfs", status: 400, requestId, bodySize: 0 });
    return new Response(JSON.stringify({ error: "Missing url query param.", requestId }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const parsed = parseIpfsUrl(rawUrl);
  if (!parsed) {
    logRequest({ route: "/api/ipfs", status: 400, requestId, bodySize: 0 });
    return new Response(JSON.stringify({ error: "Unsupported IPFS url.", requestId }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const expectsJson =
    parsed.path.endsWith(".json") || parsed.path.includes("manifest.json");
  const gatewayUrls = buildGatewayUrls(parsed);
  for (const gatewayUrl of gatewayUrls) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(gatewayUrl, {
        signal: controller.signal,
        cache: "no-store",
        headers: expectsJson ? { Accept: "application/json" } : undefined,
      });
      if (!response.ok) {
        continue;
      }
      const headers = new Headers(response.headers);
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Cache-Control", "public, max-age=300");
      headers.delete("content-encoding");
      headers.delete("content-length");
      headers.delete("transfer-encoding");
      const body = await response.arrayBuffer();
      if (expectsJson) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          continue;
        }
        const text = new TextDecoder().decode(body);
        if (!looksLikeJson(text)) {
          continue;
        }
      }
      logRequest({ route: "/api/ipfs", status: response.status, requestId, bodySize: 0 });
      return new Response(body, {
        status: response.status,
        headers,
      });
    } catch {
    } finally {
      clearTimeout(timeout);
    }
  }
  logRequest({ route: "/api/ipfs", status: 502, requestId, bodySize: 0 });
  return new Response(JSON.stringify({ error: "All IPFS gateways failed.", requestId }), {
    status: 502,
    headers: { "content-type": "application/json" },
  });
}

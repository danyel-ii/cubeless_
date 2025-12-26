import crypto from "crypto";
import { requireEnv } from "./env.js";

const PINATA_ENDPOINT = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

const dedupeCache = new Map();
const DEDUPE_TTL_MS = 10 * 60 * 1000;

function nowMs() {
  return Date.now();
}

export function hashPayload(payload) {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export function getCachedCid(hash) {
  const cached = dedupeCache.get(hash);
  if (!cached) {
    return null;
  }
  if (cached.expiresAt < nowMs()) {
    dedupeCache.delete(hash);
    return null;
  }
  return cached.cid;
}

export function setCachedCid(hash, cid) {
  dedupeCache.set(hash, { cid, expiresAt: nowMs() + DEDUPE_TTL_MS });
}

export async function pinJson(payload) {
  const jwt = requireEnv("PINATA_JWT");
  const response = await fetch(PINATA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: payload,
  });
  if (!response.ok) {
    const text = await response.text();
    const error = new Error(text || "Pinata error");
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  return data?.IpfsHash ?? null;
}

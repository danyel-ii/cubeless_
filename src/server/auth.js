import crypto from "crypto";
import { verifyMessage, getAddress } from "ethers";
import { requireEnv } from "./env.js";

const NONCE_TTL_MS = 5 * 60 * 1000;
const NONCE_PREFIX = "cubeless:nonce:v1";
const usedNonces = new Map();

function nowMs() {
  return Date.now();
}

function hmacFor(value) {
  const secret = requireEnv("SERVER_AUTH_SALT");
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function cleanupNonces() {
  const cutoff = nowMs() - NONCE_TTL_MS;
  for (const [nonce, issuedAt] of usedNonces) {
    if (issuedAt < cutoff) {
      usedNonces.delete(nonce);
    }
  }
}

export function buildNonceMessage(nonce) {
  return `${NONCE_PREFIX}:${nonce}`;
}

export function issueNonce() {
  const issuedAt = nowMs();
  const ttlMs = NONCE_TTL_MS;
  const rand = crypto.randomBytes(16).toString("hex");
  const payload = `${rand}.${issuedAt}.${ttlMs}`;
  const signature = hmacFor(payload);
  const nonce = `${payload}.${signature}`;
  return { nonce, expiresAt: issuedAt + ttlMs };
}

export function verifyNonce(nonce) {
  if (!nonce || typeof nonce !== "string") {
    return { ok: false, error: "Missing nonce" };
  }
  const parts = nonce.split(".");
  if (parts.length !== 4) {
    return { ok: false, error: "Invalid nonce format" };
  }
  const [rand, issuedAtRaw, ttlRaw, signature] = parts;
  const issuedAt = Number(issuedAtRaw);
  const ttlMs = Number(ttlRaw);
  if (!rand || !Number.isFinite(issuedAt) || !Number.isFinite(ttlMs)) {
    return { ok: false, error: "Invalid nonce values" };
  }
  const payload = `${rand}.${issuedAt}.${ttlMs}`;
  const expected = hmacFor(payload);
  if (signature !== expected) {
    return { ok: false, error: "Invalid nonce signature" };
  }
  const expiresAt = issuedAt + ttlMs;
  if (nowMs() > expiresAt) {
    return { ok: false, error: "Nonce expired" };
  }
  cleanupNonces();
  if (usedNonces.has(nonce)) {
    return { ok: false, error: "Nonce already used" };
  }
  usedNonces.set(nonce, issuedAt);
  return { ok: true, expiresAt };
}

export function verifySignature({ address, nonce, signature }) {
  // TODO: Support EIP-1271 contract wallet verification when needed.
  if (!address || !signature) {
    return { ok: false, error: "Missing address or signature" };
  }
  let checksum;
  try {
    checksum = getAddress(address);
  } catch (error) {
    return { ok: false, error: "Invalid address" };
  }
  const message = buildNonceMessage(nonce);
  let recovered;
  try {
    recovered = verifyMessage(message, signature);
  } catch (error) {
    return { ok: false, error: "Signature verification failed" };
  }
  if (getAddress(recovered) !== checksum) {
    return { ok: false, error: "Signature mismatch" };
  }
  return { ok: true, address: checksum };
}

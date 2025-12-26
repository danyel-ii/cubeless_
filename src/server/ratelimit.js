const buckets = new Map();
const DEFAULT_MAX_ENTRIES = 2000;

function nowMs() {
  return Date.now();
}

function prune(maxEntries, ttlMs) {
  if (buckets.size <= maxEntries) {
    return;
  }
  const cutoff = nowMs() - ttlMs;
  for (const [key, entry] of buckets) {
    if (entry.lastSeen < cutoff) {
      buckets.delete(key);
    }
    if (buckets.size <= maxEntries) {
      return;
    }
  }
  const extra = buckets.size - maxEntries;
  if (extra > 0) {
    const keys = buckets.keys();
    for (let i = 0; i < extra; i += 1) {
      const next = keys.next();
      if (next.done) {
        break;
      }
      buckets.delete(next.value);
    }
  }
}

export function checkRateLimit(
  key,
  {
    capacity = 10,
    refillPerSec = 1,
    ttlMs = 5 * 60 * 1000,
    maxEntries = DEFAULT_MAX_ENTRIES,
  } = {}
) {
  const now = nowMs();
  const entry = buckets.get(key) || {
    tokens: capacity,
    lastRefill: now,
    lastSeen: now,
  };
  const elapsed = Math.max(0, now - entry.lastRefill);
  const refill = (elapsed / 1000) * refillPerSec;
  entry.tokens = Math.min(capacity, entry.tokens + refill);
  entry.lastRefill = now;
  entry.lastSeen = now;

  if (entry.tokens < 1) {
    const retryAfter = Math.ceil((1 - entry.tokens) / refillPerSec);
    buckets.set(key, entry);
    prune(maxEntries, ttlMs);
    return { ok: false, remaining: 0, retryAfter };
  }

  entry.tokens -= 1;
  buckets.set(key, entry);
  prune(maxEntries, ttlMs);
  return { ok: true, remaining: Math.floor(entry.tokens), retryAfter: 0 };
}

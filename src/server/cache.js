const cache = new Map();
const MAX_ENTRIES = 1000;

export function getCache(key) {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry.value;
}

export function setCache(key, value, ttlMs) {
  const expiresAt = ttlMs ? Date.now() + ttlMs : null;
  cache.set(key, { value, expiresAt });
  if (cache.size > MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

export function clearCache(key) {
  cache.delete(key);
}

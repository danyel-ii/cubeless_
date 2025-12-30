const counters = new Map();
const FLUSH_INTERVAL_MS = 60_000;
let lastFlush = Date.now();

function buildKey(name, tags) {
  if (!tags) {
    return name;
  }
  const sorted = Object.keys(tags)
    .sort()
    .map((key) => `${key}:${tags[key]}`)
    .join(",");
  return sorted ? `${name}|${sorted}` : name;
}

function flushIfNeeded() {
  const now = Date.now();
  if (now - lastFlush < FLUSH_INTERVAL_MS) {
    return;
  }
  if (!counters.size) {
    lastFlush = now;
    return;
  }
  const payload = Object.fromEntries(counters.entries());
  counters.clear();
  lastFlush = now;
  console.info("[metrics]", payload);
}

export function recordMetric(name, tags) {
  const key = buildKey(name, tags);
  counters.set(key, (counters.get(key) || 0) + 1);
  flushIfNeeded();
}

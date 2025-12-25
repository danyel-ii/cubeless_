function readEnvValue(key) {
  const raw = import.meta?.env?.[key];
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

export function getGifLibraryCid() {
  return readEnvValue("VITE_GIF_LIBRARY_CID") ?? "GIF_LIBRARY_CID_TBD";
}

export function getTokenViewBaseUrl() {
  const explicit = readEnvValue("VITE_TOKEN_VIEW_BASE_URL");
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

export function buildTokenViewUrl(tokenId) {
  const base = getTokenViewBaseUrl();
  if (!base) {
    return "";
  }
  return `${base}/m/${tokenId}`;
}

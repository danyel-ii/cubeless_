import crypto from "crypto";

export function getClientIp(request) {
  const vercelForwarded = request.headers.get("x-vercel-proxied-for");
  const realIp = request.headers.get("x-real-ip");
  const forwarded = request.headers.get("x-forwarded-for");

  if (vercelForwarded || realIp) {
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    if (realIp) {
      return realIp;
    }
    return vercelForwarded;
  }

  if (realIp) {
    return realIp;
  }
  return "unknown";
}

export function makeRequestId() {
  return crypto.randomUUID();
}

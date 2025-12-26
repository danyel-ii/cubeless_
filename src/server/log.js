import crypto from "crypto";

function hashPrefix(value) {
  if (!value) {
    return null;
  }
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
}

export function logRequest({
  route,
  status,
  requestId,
  bodySize,
  payloadHash,
  actor,
}) {
  const payloadHashPrefix = hashPrefix(payloadHash);
  const actorHashPrefix = hashPrefix(actor);
  console.info("[api]", {
    route,
    status,
    requestId,
    bodySize,
    payloadHashPrefix,
    actorHashPrefix,
  });
}

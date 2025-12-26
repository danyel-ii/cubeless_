const NONCE_PREFIX = "cubeless:nonce:v1";

function buildNonceMessage(nonce) {
  return `${NONCE_PREFIX}:${nonce}`;
}

async function fetchNonce() {
  const response = await fetch("/api/nonce", { method: "GET" });
  if (!response.ok) {
    throw new Error(`Nonce request failed (${response.status}).`);
  }
  const json = await response.json();
  if (!json?.nonce) {
    throw new Error("Nonce response missing nonce.");
  }
  return json.nonce;
}

export async function pinTokenMetadata({ metadata, signer, address }) {
  if (!signer || !address) {
    throw new Error("Wallet signer unavailable.");
  }
  const nonce = await fetchNonce();
  const signature = await signer.signMessage(buildNonceMessage(nonce));

  const response = await fetch("/api/pin/metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address,
      nonce,
      signature,
      payload: metadata,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Pinning failed (${response.status})`);
  }
  const json = await response.json();
  if (!json?.tokenURI) {
    throw new Error("Pinning failed to return a token URI.");
  }
  return json.tokenURI;
}

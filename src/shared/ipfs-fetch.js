const GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://nftstorage.link/ipfs/",
];

export function buildGatewayUrls(ipfsUrl) {
  if (!ipfsUrl.startsWith("ipfs://")) {
    return [ipfsUrl];
  }
  const path = ipfsUrl.replace("ipfs://", "");
  return GATEWAYS.map((base) => `${base}${path}`);
}

export async function fetchWithGateways(ipfsUrl, { timeoutMs = 8000 } = {}) {
  const urls = buildGatewayUrls(ipfsUrl);
  for (const url of urls) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (response.ok) {
        clearTimeout(timeout);
        return { response, url };
      }
    } catch (error) {
      // try next gateway
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("All IPFS gateways failed.");
}

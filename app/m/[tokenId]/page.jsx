import { Interface } from "ethers";
import AppShell from "../../ui/AppShell.jsx";
import deployment from "../../../contracts/deployments/mainnet.json";
import abi from "../../../contracts/abi/CubixlesMinter.json";
import { buildGatewayUrls } from "../../../src/shared/ipfs-fetch.js";

const DEFAULT_DESCRIPTION =
  "Mint interactive p5.js artworks whose provenance is tethered to NFTs you already own.";
const DEFAULT_IMAGE_PATH = "/ogImage.png";

export const dynamic = "force-dynamic";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_TOKEN_VIEW_BASE_URL) {
    return process.env.NEXT_PUBLIC_TOKEN_VIEW_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

function resolveImageUrl(imageUrl, baseUrl) {
  if (!imageUrl) {
    return null;
  }
  if (imageUrl.startsWith("ipfs://")) {
    return buildGatewayUrls(imageUrl)[0];
  }
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }
  return new URL(imageUrl, baseUrl).toString();
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

async function fetchTokenUri(tokenId) {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey || !tokenId) {
    return null;
  }
  const chainId = deployment.chainId || 1;
  const rpcUrl =
    chainId === 1
      ? `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`
      : chainId === 11155111
      ? `https://eth-sepolia.g.alchemy.com/v2/${apiKey}`
      : null;
  if (!rpcUrl) {
    return null;
  }
  const iface = new Interface(abi);
  const data = iface.encodeFunctionData("tokenURI", [BigInt(tokenId)]);
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_call",
    params: [{ to: deployment.address, data }, "latest"],
  };
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  const json = await response.json();
  const result = json?.result;
  if (!result) {
    return null;
  }
  const decoded = iface.decodeFunctionResult("tokenURI", result);
  return decoded?.[0] ?? null;
}

async function fetchTokenMetadata(tokenId) {
  const tokenUri = await fetchTokenUri(tokenId);
  if (!tokenUri) {
    return null;
  }
  if (tokenUri.startsWith("ipfs://")) {
    const urls = buildGatewayUrls(tokenUri);
    for (const url of urls) {
      const json = await fetchJson(url);
      if (json) {
        return json;
      }
    }
    return null;
  }
  return fetchJson(tokenUri);
}

export async function generateMetadata({ params }) {
  const tokenId = params?.tokenId;
  const baseUrl = getBaseUrl();
  const fallbackImage = new URL(DEFAULT_IMAGE_PATH, baseUrl).toString();
  let title = tokenId ? `cubixles_ #${tokenId}` : "cubixles_";
  let description = DEFAULT_DESCRIPTION;
  let ogImage = fallbackImage;

  try {
    const metadata = await fetchTokenMetadata(tokenId);
    if (metadata?.name) {
      title = metadata.name;
    }
    if (metadata?.description) {
      description = metadata.description;
    }
    const resolvedImage = resolveImageUrl(metadata?.image, baseUrl);
    if (resolvedImage) {
      ogImage = resolvedImage;
    }
  } catch (error) {
    void error;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/m/${tokenId}`,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

function getBaseUrl() {
  const raw = (
    process.env.NEXT_PUBLIC_TOKEN_VIEW_BASE_URL ||
    process.env.VERCEL_URL ||
    ""
  ).trim();
  if (!raw) {
    return "";
  }
  const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return normalized.replace(/\/$/, "");
}

export function generateMetadata({ params }) {
  const tokenId = params?.tokenId ? String(params.tokenId) : "";
  const title = tokenId ? `cubixles_ #${tokenId}` : "cubixles_ token";
  const description =
    "Mint interactive p5.js artworks whose provenance is tethered to NFTs you already own.";
  const baseUrl = getBaseUrl();
  const ogImage = baseUrl
    ? `${baseUrl}/m/${encodeURIComponent(tokenId)}/opengraph-image`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: baseUrl ? `${baseUrl}/m/${tokenId}` : undefined,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default function TokenViewPage() {
  return <AppShell />;
}

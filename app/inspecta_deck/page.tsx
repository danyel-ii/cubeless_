import { headers } from "next/headers";
import "../shaolin_deck/shaolin-deck.css";
import { DeckPage } from "../shaolin_deck/DeckPage.jsx";
import { getBasePath } from "./_lib/basePath";

export const dynamic = "force-dynamic";

const TITLE = "cubixles_ — Provenance as building blocks";
const DESCRIPTION =
  "Provenance as building blocks, NFTs as materials, and citations as structure.";

const DEFAULT_CHAIN_ID = 1;
const DEFAULT_PAGE_SIZE = 8;

async function fetchInitialTokenList() {
  const headerList = headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const baseUrl = host ? `${proto}://${host}` : "http://localhost:3000";
  const params = new URLSearchParams({
    limit: String(DEFAULT_PAGE_SIZE),
    chainId: String(DEFAULT_CHAIN_ID),
    mode: "minter",
  });
  const forwardHeaders: Record<string, string> = {};
  const cookieHeader = headerList.get("cookie");
  const bypassHeader = headerList.get("x-vercel-protection-bypass");
  if (cookieHeader) {
    forwardHeaders.cookie = cookieHeader;
  }
  if (bypassHeader) {
    forwardHeaders["x-vercel-protection-bypass"] = bypassHeader;
  }
  try {
    const response = await fetch(`${baseUrl}/api/tokens?${params.toString()}`, {
      cache: "no-store",
      headers: forwardHeaders,
    });
    const payload = response.ok ? await response.json() : null;
    if (!response.ok) {
      return {
        tokens: [],
        pageKey: null,
        pages: 1,
        truncated: false,
        error: payload?.error || `Token list request failed (${response.status}).`,
      };
    }
    return payload || { tokens: [], pageKey: null, pages: 1, truncated: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { tokens: [], pageKey: null, pages: 1, truncated: false, error: message };
  }
}

function getBaseUrl() {
  const normalizedBasePath = getBasePath();
  const headerList = headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  if (host) {
    return `${proto}://${host}${normalizedBasePath}`;
  }
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (envUrl) {
    const normalizedEnv = envUrl.replace(/\/$/, "");
    return normalizedEnv.endsWith(normalizedBasePath)
      ? normalizedEnv
      : `${normalizedEnv}${normalizedBasePath}`;
  }
  return `http://localhost:3000${normalizedBasePath}`;
}

function buildAbsoluteUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function generateMetadata() {
  const baseUrl = getBaseUrl();
  const ogImage = buildAbsoluteUrl(baseUrl, "/ogImage.png");
  const pageUrl = buildAbsoluteUrl(baseUrl, "/");

  return {
    title: TITLE,
    description: DESCRIPTION,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: pageUrl,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
      images: [ogImage],
    },
  };
}

export default async function HomePage() {
  const initialTokenList = await fetchInitialTokenList();
  return (
    <DeckPage
      initialTokenList={initialTokenList}
      tokensEndpoint="/api/tokens"
      tokenMode="minter"
    />
  );
}

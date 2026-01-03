import AppShell from "../../ui/AppShell.jsx";

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

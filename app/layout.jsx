import "./globals.css";

const baseUrl =
  process.env.NEXT_PUBLIC_TOKEN_VIEW_BASE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: "cubixles_",
  description:
    "Mint interactive p5.js artworks whose provenance is tethered to NFTs you already own.",
  openGraph: {
    title: "cubixles_",
    description:
      "Mint interactive p5.js artworks whose provenance is tethered to NFTs you already own.",
    images: ["/ogImage.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "cubixles_",
    description:
      "Mint interactive p5.js artworks whose provenance is tethered to NFTs you already own.",
    images: ["/ogImage.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
      </body>
    </html>
  );
}

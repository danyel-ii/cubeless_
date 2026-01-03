import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image({ params }) {
  const tokenId = params?.tokenId || "—";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(135deg, #05070c 0%, #0e111c 45%, #14192b 100%)",
          color: "#e6e9ef",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 52,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#a8dcbe",
          }}
        >
          cubixles_
        </div>
        <div style={{ marginTop: 20, fontSize: 32, color: "#e6e9ef" }}>
          Token #{tokenId}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 18,
            maxWidth: 760,
            color: "rgba(230, 233, 239, 0.72)",
          }}
        >
          Mint interactive p5.js artworks tethered to your existing NFTs.
        </div>
        <div
          style={{
            marginTop: 48,
            padding: "12px 24px",
            borderRadius: 999,
            border: "1px solid rgba(255, 255, 255, 0.18)",
            fontSize: 16,
            color: "#cfe3ff",
          }}
        >
          View token on mainnet
        </div>
      </div>
    ),
    size
  );
}

import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #079a91 0%, #0a7d76 52%, #11211f 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 136,
            height: 136,
            borderRadius: 42,
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0.12))",
            border: "8px solid rgba(255, 255, 255, 0.22)",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 88,
              height: 88,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(8, 27, 25, 0.18)",
              color: "#ffffff",
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: "-0.08em",
            }}
          >
            B
          </div>
        </div>
      </div>
    ),
    size,
  );
}

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
          background:
            "linear-gradient(160deg, #079a91 0%, #087d77 54%, #111d1b 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 128,
            height: 128,
            borderRadius: 40,
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.18)",
            border: "8px solid rgba(255, 255, 255, 0.28)",
            color: "#ffffff",
            fontSize: 80,
            fontWeight: 800,
            letterSpacing: "-0.06em",
            textTransform: "lowercase",
          }}
        >
          b
        </div>
      </div>
    ),
    size,
  );
}

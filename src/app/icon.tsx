import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
            width: 360,
            height: 360,
            borderRadius: 108,
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0.12))",
            border: "18px solid rgba(255, 255, 255, 0.22)",
            boxShadow: "0 24px 64px rgba(6, 24, 22, 0.28)",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 232,
              height: 232,
              borderRadius: 72,
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(8, 27, 25, 0.18)",
              color: "#ffffff",
              fontSize: 176,
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

import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(160deg, #079a91 0%, #0a7d76 52%, #11211f 100%)",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "rgba(255,255,255,0.18)",
            border: "7px solid rgba(255,255,255,0.22)",
            borderRadius: 40,
            color: "#ffffff",
            display: "flex",
            fontSize: 92,
            fontWeight: 800,
            height: 136,
            justifyContent: "center",
            letterSpacing: "-0.08em",
            width: 136,
          }}
        >
          B
        </div>
      </div>
    ),
    { width: 192, height: 192 },
  );
}

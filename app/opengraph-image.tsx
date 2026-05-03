import { ImageResponse } from "next/og";

export const alt = "Build | Construction Material Supply Saudi Arabia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #F4F3EB 0%, #ffffff 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px"
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#1D3F1F",
            marginBottom: 20,
            letterSpacing: "-2px"
          }}
        >
          Build
        </div>
        <div
          style={{
            fontSize: 26,
            color: "#1D3F1F",
            opacity: 0.7,
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.5
          }}
        >
          Construction Material Supply · Saudi Arabia
        </div>
        <div
          style={{
            marginTop: 40,
            background: "#09B14B",
            borderRadius: 50,
            padding: "14px 40px",
            fontSize: 20,
            color: "#ffffff",
            fontWeight: 600
          }}
        >
          build.sa
        </div>
      </div>
    ),
    { ...size }
  );
}

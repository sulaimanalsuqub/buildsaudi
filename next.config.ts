import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js dev mode's HMR bundle requires eval(); production never needs it.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.resend.com https://www.google-analytics.com https://challenges.cloudflare.com",
      "frame-src 'self' https://www.googletagmanager.com https://challenges.cloudflare.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // pdf-parse contains native/CJS dependencies and is loaded only on server routes.
  serverExternalPackages: ["pdf-parse"],
  // pdfjs-dist (تبعية pdf-parse) تستدعي @napi-rs/canvas ديناميكياً (require داخل try/catch) — تعقّب Vercel التلقائي (@vercel/nft)
  // لا يكتشف هذا النمط الديناميكي فيُسقط الملف الثنائي من الحزمة المنشورة → "Cannot find module '@napi-rs/canvas'" وقت التشغيل
  outputFileTracingIncludes: {
    "/api/quotes/register": ["./node_modules/@napi-rs/canvas*/**/*"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

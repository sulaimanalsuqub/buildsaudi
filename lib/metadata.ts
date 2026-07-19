import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

/**
 * Shared across both locale root layouts (app/(site)/layout.tsx and app/ar/layout.tsx).
 * Locale-specific fields (title, description, keywords, alternates, openGraph, twitter)
 * are set per layout since each is its own Next.js root layout.
 */
export const commonMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: "Build Saudi",
  authors: [{ name: "Build Saudi", url: siteConfig.url }],
  creator: "Build Saudi",
  publisher: "Build Saudi",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
};

export const localeAlternates = {
  languages: {
    en: siteConfig.url,
    ar: `${siteConfig.url}/ar`,
    "x-default": `${siteConfig.url}/ar`,
  },
};

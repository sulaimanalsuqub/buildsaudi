import type { Metadata } from "next";
import { Rubik } from "next/font/google";

import { siteConfig } from "@/lib/site";
import { OrganizationSchema, WebsiteSchema } from "@/components/seo/schema-org";

import "./globals.css";

const rubik = Rubik({
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Build | Construction Material Supply Saudi Arabia — DDP Delivery",
    template: "%s | Build Saudi"
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  applicationName: "Build Saudi",
  authors: [{ name: "Build Saudi", url: siteConfig.url }],
  creator: "Build Saudi",
  publisher: "Build Saudi",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: siteConfig.url,
    languages: {
      "en": siteConfig.url,
      "ar": `${siteConfig.url}/ar`,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon.png", type: "image/png" }
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }]
  },
  openGraph: {
    title: "Build | Construction Material Supply Saudi Arabia",
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: "Build Saudi",
    type: "website",
    locale: "en_US",
    alternateLocale: "ar_SA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Build | Construction Material Supply Saudi Arabia",
    description: siteConfig.description,
    site: "@buildsaudi",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
      </head>
      <body className={rubik.className}>{children}</body>
    </html>
  );
}

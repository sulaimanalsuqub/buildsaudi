import type { Metadata } from "next";
import { Rubik } from "next/font/google";

import { siteConfig } from "@/lib/site";

import "./globals.css";

const rubik = Rubik({
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Build | Construction Vendor Registration",
    template: "%s | Build"
  },
  description: siteConfig.description,
  applicationName: "Build",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon.png", type: "image/png" }
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }]
  },
  openGraph: {
    title: "Build | Construction Vendor Registration",
    description: siteConfig.description,
    type: "website",
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "Build | Construction Vendor Registration",
    description: siteConfig.description
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={rubik.className}>{children}</body>
    </html>
  );
}

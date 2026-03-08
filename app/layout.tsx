import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import Script from "next/script";

import { siteConfig } from "@/lib/site";
import { OrganizationSchema, WebsiteSchema } from "@/components/seo/schema-org";

import "./globals.css";

const GTM_ID = "GTM-KBN6BHR";

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
      <body className={rubik.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
        {/* Google Tag Manager (script) */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`
          }}
        />
      </body>
    </html>
  );
}

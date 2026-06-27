import type { Metadata } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import Script from "next/script";
import { Toaster } from "sonner";

import { siteConfig } from "@/lib/site";
import { OrganizationSchema, WebsiteSchema } from "@/components/seo/schema-org";

import "./globals.css";

const GTM_ID = "GTM-KBN6BHR";

const gtAmericaArabic = localFont({
  src: [
    { path: "./fonts/GTAmericaArabic-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/GTAmericaArabic-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/GTAmericaArabic-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/GTAmericaArabic-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/GTAmericaArabic-Black.ttf", weight: "900", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Build | Building Materials Supplier — Saudi Arabia",
    template: "%s | Build Saudi",
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
    languages: {
      en: siteConfig.url,
      ar: `${siteConfig.url}/ar`,
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const lang = pathname === "/ar" || pathname.startsWith("/ar/") ? "ar" : "en";

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
      </head>
      <body className={gtAmericaArabic.className}>
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
        <Toaster position="top-center" richColors dir="rtl" />
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

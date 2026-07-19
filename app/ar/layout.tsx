import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "sonner";

import { siteConfig } from "@/lib/site";
import { commonMetadata, localeAlternates } from "@/lib/metadata";
import { gtAmericaArabic } from "@/lib/fonts";
import { OrganizationSchema, WebsiteSchema } from "@/components/seo/schema-org";
import { GtmNoscript, GtmScript } from "@/components/analytics/gtm";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { SiteHeader } from "@/components/layout/site-header";

import "../globals.css";

export const metadata: Metadata = {
  ...commonMetadata,
  title: {
    default: "Build | توريد مواد بناء وتشطيب للمشاريع في السعودية",
    template: "%s | بيلد السعودية",
  },
  description: siteConfig.descriptionAr,
  keywords: siteConfig.keywordsAr,
  alternates: localeAlternates,
  openGraph: {
    title: "Build | توريد مواد بناء وتشطيب للمشاريع في السعودية",
    description: siteConfig.descriptionAr,
    url: `${siteConfig.url}/ar`,
    siteName: "بيلد السعودية",
    type: "website",
    locale: "ar_SA",
    alternateLocale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Build | توريد مواد بناء وتشطيب للمشاريع في السعودية",
    description: siteConfig.descriptionAr,
    site: "@buildsaudi",
  },
};

export default function ArabicRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
      </head>
      <body className={gtAmericaArabic.className}>
        <GtmNoscript />
        <Suspense fallback={<div className="h-[72px]" />}>
          <SiteHeader isRtl />
        </Suspense>
        <div className="pt-[72px]">{children}</div>
        <ConditionalFooter isRtl />
        <Toaster position="top-center" richColors dir="rtl" />
        <GtmScript />
      </body>
    </html>
  );
}

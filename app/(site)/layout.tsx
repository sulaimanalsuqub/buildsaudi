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
    default: "Build | Building Materials & Finishes Supplier — Saudi Arabia",
    template: "%s | Build Saudi",
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  alternates: localeAlternates,
  openGraph: {
    title: "Build | Building Materials & Finishes Supplier — Saudi Arabia",
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: "Build Saudi",
    type: "website",
    locale: "en_US",
    alternateLocale: "ar_SA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Build | Building Materials & Finishes Supplier — Saudi Arabia",
    description: siteConfig.description,
    site: "@buildsaudi",
  },
};

export default function EnglishRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
      </head>
      <body className={gtAmericaArabic.className}>
        <GtmNoscript />
        <Suspense fallback={<div className="h-[72px]" />}>
          <SiteHeader />
        </Suspense>
        <div className="pt-[72px]">{children}</div>
        <ConditionalFooter />
        <Toaster position="top-center" richColors dir="rtl" />
        <GtmScript />
      </body>
    </html>
  );
}

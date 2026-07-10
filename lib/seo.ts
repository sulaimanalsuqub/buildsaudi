import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";

type PageSeoInput = {
  title: string;
  description: string;
  /** App path, e.g. `/ar/get-quote` or `/privacy-policy` */
  path: string;
  keywords?: string[];
  lang?: "ar" | "en";
  noindex?: boolean;
};

function toAbsoluteUrl(path: string): string {
  if (path === "/") return siteConfig.url;
  return `${siteConfig.url}${path}`;
}

function languageAlternates(path: string): Record<string, string> {
  let en: string;
  let ar: string;

  if (path === "/") {
    en = siteConfig.url;
    ar = `${siteConfig.url}/ar`;
  } else if (path.startsWith("/ar")) {
    const enPath = path.replace(/^\/ar/, "") || "/";
    en = toAbsoluteUrl(enPath);
    ar = toAbsoluteUrl(path);
  } else {
    en = toAbsoluteUrl(path);
    ar = toAbsoluteUrl(`/ar${path}`);
  }

  // السوق الأساسي عربي — x-default يشير للنسخة العربية
  return {
    en,
    ar,
    "x-default": ar,
  };
}

/** Per-page metadata with canonical, hreflang, OG, and Twitter. */
export function pageMetadata({
  title,
  description,
  path,
  keywords,
  lang = "en",
  noindex = false,
}: PageSeoInput): Metadata {
  const isAr = lang === "ar";
  const url = toAbsoluteUrl(path);
  const languages = languageAlternates(path);

  return {
    title: { absolute: title },
    description,
    keywords: keywords ?? (isAr ? siteConfig.keywordsAr : siteConfig.keywords),
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: isAr ? "بيلد" : "Build Saudi",
      locale: isAr ? "ar_SA" : "en_US",
      alternateLocale: isAr ? "en_US" : "ar_SA",
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: isAr ? "بيلد" : "Build Saudi" }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@buildsaudi",
      title,
      description,
    },
  };
}

import { Metadata } from "next";

import { HomeContent } from "@/components/sections/home-content";
import { ServiceSchema } from "@/components/seo/schema-org";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "بيلد | مورد مواد البناء في السعودية" },
  description: siteConfig.descriptionAr,
  keywords: siteConfig.keywordsAr,
  alternates: {
    canonical: `${siteConfig.url}/ar`,
    languages: { en: siteConfig.url },
  },
  openGraph: {
    title: "بيلد | مورد مواد البناء في السعودية",
    description: siteConfig.descriptionAr,
    url: `${siteConfig.url}/ar`,
    locale: "ar_SA",
    type: "website",
  },
};

export default function ArabicHomePage() {
  return (
    <>
      <ServiceSchema isRtl />
      <HomeContent isRtl />
    </>
  );
}

import { Metadata } from "next";

import { HomeContent } from "@/components/sections/home-content";
import { ServiceSchema } from "@/components/seo/schema-org";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Build | مورد مواد البناء في السعودية" },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  alternates: {
    canonical: siteConfig.url,
    languages: { ar: `${siteConfig.url}/ar` },
  },
  openGraph: {
    title: "Build | مورد مواد البناء في السعودية",
    description: siteConfig.description,
    url: siteConfig.url,
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <ServiceSchema />
      <HomeContent />
    </>
  );
}

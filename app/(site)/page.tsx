import { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { HomeContent } from "@/components/sections/home-content";
import { ServiceSchema } from "@/components/seo/schema-org";

export const metadata: Metadata = {
  title: { absolute: "Build | Construction Material Supplier in Saudi Arabia" },
  description:
    "Build sources and delivers construction materials DDP to your Saudi project site. Faster procurement, competitive pricing, and full logistics — from supplier to site.",
  keywords: siteConfig.keywords,
  alternates: {
    canonical: siteConfig.url,
    languages: { ar: `${siteConfig.url}/ar` },
  },
  openGraph: {
    title: "Build | Construction Material Supply Saudi Arabia",
    description:
      "Source and deliver construction materials DDP to your Saudi project site. Competitive pricing, full logistics.",
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

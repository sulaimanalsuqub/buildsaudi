import { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { HomeContent } from "@/components/sections/home-content";
import { ServiceSchema } from "@/components/seo/schema-org";

export const metadata: Metadata = {
  title: { absolute: "بيلد | مورد مواد البناء في السعودية" },
  description:
    "بيلد منصة سعودية لتوريد مواد البناء بتوصيل DDP مباشرة لموقع مشروعك — أسعار تنافسية، لوجستيات متكاملة، بدون تعقيد.",
  keywords: siteConfig.keywordsAr,
  alternates: {
    canonical: `${siteConfig.url}/ar`,
    languages: { en: siteConfig.url },
  },
  openGraph: {
    title: "بيلد | توريد مواد البناء في السعودية",
    description:
      "توريد مواد البناء DDP مباشرة لموقع مشروعك. أسعار تنافسية ولوجستيات متكاملة.",
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

import { HomeContent } from "@/components/sections/home-content";
import { ServiceSchema } from "@/components/seo/schema-org";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar",
  title: "مورد مواد بناء وتشطيب للمشاريع | بيلد السعودية",
  description: siteConfig.descriptionAr,
  keywords: siteConfig.keywordsAr,
});

export default function ArabicHomePage() {
  return (
    <>
      <ServiceSchema isRtl />
      <HomeContent isRtl />
    </>
  );
}

import { HomeContent } from "@/components/sections/home-content";
import { ServiceSchema } from "@/components/seo/schema-org";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar",
  title: "بيلد | مورد مواد بناء السعودية — توريد للمشاريع الإنشائية",
  description:
    "مورد مواد بناء للمشاريع في الرياض وجدة وجميع مناطق المملكة. طلب عرض سعر، جدول كميات، وتوريد حديد وإسمنت ومواد التشطيب مع التسليم لموقع المشروع.",
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
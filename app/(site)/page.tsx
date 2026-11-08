import { HomeContent } from "@/components/sections/home-content";
import { ServiceSchema } from "@/components/seo/schema-org";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = pageMetadata({
  lang: "en",
  path: "/",
  title: siteConfig.seoTitle,
  description: siteConfig.description,
  keywords: siteConfig.keywords,
});

export default function HomePage() {
  return (
    <>
      <ServiceSchema />
      <HomeContent />
    </>
  );
}

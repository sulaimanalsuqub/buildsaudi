import { HomeContent } from "@/components/sections/home-content";
import { ServiceSchema } from "@/components/seo/schema-org";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = pageMetadata({
  lang: "en",
  path: "/",
  title: "Build | Building Materials Supplier — Construction Projects Saudi Arabia",
  description:
    "Building materials supplier for projects across Riyadh, Jeddah, and the Kingdom. Request a quote, submit your bill of quantities, and get steel, cement, and finishing materials delivered to your site.",
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
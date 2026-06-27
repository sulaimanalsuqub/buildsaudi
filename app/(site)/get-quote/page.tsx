import { QuotePageContent } from "@/components/sections/quote-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/get-quote",
  title: "Building Materials Quote Request | Project Site Delivery — Build",
  description:
    "Request building materials for your project and submit your bill of quantities. We prepare your quote and supply steel, cement, and finishing materials with delivery to your site in Saudi Arabia.",
  keywords: [
    "building materials quote request",
    "construction material supply",
    "bill of quantities",
    "steel and cement supply",
    "building materials Riyadh",
    "building materials Jeddah",
    "wholesale building materials",
  ],
});

export default function GetQuotePage() {
  return <QuotePageContent />;
}
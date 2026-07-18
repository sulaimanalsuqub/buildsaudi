import { QuotePageContent } from "@/components/sections/quote-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/get-quote",
  title: "Request Building Materials Supply | Build Saudi",
  description:
    "Contact Build to request building materials and finishes for your project. Email our sales team for a supply proposal with delivery to your site in Saudi Arabia.",
  keywords: [
    "request building materials supply",
    "construction materials quote Saudi Arabia",
    "building materials for contractors",
    "finishes supply for developers",
    "project site material delivery",
  ],
});

export default function GetQuotePage() {
  return <QuotePageContent />;
}

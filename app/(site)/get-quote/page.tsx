import { QuotePageContent } from "@/components/sections/quote-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/get-quote",
  title: "Get a Building Materials Quote for Your Project | Build",
  description: "Send your bill of quantities or material list and project location. Build will review your requirements and prepare a quote for supply and site delivery.",
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

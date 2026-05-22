import { Metadata } from "next";

import { QuotePageContent } from "@/components/sections/quote-page-content";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Submit your project details and receive a comprehensive price quote from Build.",
};

export default function GetQuotePage() {
  return <QuotePageContent />;
}

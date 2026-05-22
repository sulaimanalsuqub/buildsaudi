import { Metadata } from "next";

import { QuotePageContent } from "@/components/sections/quote-page-content";

export const metadata: Metadata = {
  title: "Order Products",
  description: "Send your required materials request and receive follow-up from Build.",
};

export default function GetQuotePage() {
  return <QuotePageContent />;
}

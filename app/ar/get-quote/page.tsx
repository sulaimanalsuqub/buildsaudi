import { Metadata } from "next";

import { QuotePageContent } from "@/components/sections/quote-page-content";

export const metadata: Metadata = {
  title: "أطلب المنتجات",
  description: "أرسل طلب المواد المطلوبة لمشروعك واستلم متابعة من بيلد.",
};

export default function ArabicGetQuotePage() {
  return <QuotePageContent isRtl />;
}

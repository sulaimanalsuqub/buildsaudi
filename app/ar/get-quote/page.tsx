import { Metadata } from "next";

import { QuotePageContent } from "@/components/sections/quote-page-content";

export const metadata: Metadata = {
  title: "اطلب عرض سعر",
  description: "أرسل تفاصيل مشروعك واستلم عرض سعر شامل من بيلد خلال 24 ساعة.",
};

export default function ArabicGetQuotePage() {
  return <QuotePageContent isRtl />;
}

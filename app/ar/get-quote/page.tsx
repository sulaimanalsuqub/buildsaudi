import { QuotePageContent } from "@/components/sections/quote-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar/get-quote",
  title: "اطلب توريد مواد بناء لمشروعك | بيلد",
  description:
    "تواصل مع بيلد لطلب توريد مواد البناء والتشطيب لمشروعك. راسل فريق المبيعات وسنعدّ عرض التوريد مع التسليم لموقع العمل في السعودية.",
  keywords: [
    "طلب توريد مواد بناء",
    "توريد مواد بناء للمشاريع",
    "مورد مواد بناء للمقاولين",
    "توريد مواد التشطيب",
    "توريد مواد بناء الرياض",
    "توريد مواد بناء جدة",
    "عرض سعر توريد مواد بناء",
  ],
});

export default function ArabicGetQuotePage() {
  return <QuotePageContent isRtl quoteEmail={process.env.QUOTE_INTAKE_EMAIL || "sales@build.sa"} />;
}

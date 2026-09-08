import { QuotePageContent } from "@/components/sections/quote-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar/get-quote",
  title: "عرض سعر مواد بناء وتشطيبات لمشروعك | بيلد",
  description: "أرسل جدول الكميات أو قائمة المواد وحدد موقع مشروعك. يراجع فريق بيلد احتياجك ويجهّز عرض سعر لتوريد مواد البناء والتشطيبات إلى موقع العمل.",
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
  return <QuotePageContent isRtl />;
}

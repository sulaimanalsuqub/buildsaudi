import { QuotePageContent } from "@/components/sections/quote-page-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar/get-quote",
  title: "طلب عرض سعر مواد بناء | توريد لموقع المشروع — بيلد",
  description:
    "اطلب توريد مواد البناء لمشروعك وارفق جدول الكميات. نُعِدّ عرض السعر ونورد الحديد والإسمنت ومواد التشطيب مع التسليم لموقع العمل في السعودية.",
  keywords: [
    "طلب عرض سعر مواد بناء",
    "توريد مواد بناء",
    "جدول كميات مواد بناء",
    "توريد حديد وإسمنت",
    "مواد بناء للمقاولين",
    "توريد مواد بناء الرياض",
    "توريد مواد بناء جدة",
    "شراء مواد بناء بالجملة",
  ],
});

export default function ArabicGetQuotePage() {
  return <QuotePageContent isRtl />;
}
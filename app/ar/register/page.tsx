import { VendorRegisterContent } from "@/components/sections/vendor-register-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar/register",
  title: "سجّل كمورد لدى بيلد",
  description: "سجّل منشأتك كمورد لدى بيلد لتوريد مواد البناء والتشطيبات للمشاريع في السعودية. أضف بياناتك ومنتجاتك والمستندات المطلوبة وقدّم طلبك للمراجعة.",
  keywords: [
    "تسجيل مورد مواد بناء",
    "مورد مواد بناء السعودية",
    "توريد مواد بناء للمشاريع",
    "تأهيل موردين مواد بناء",
  ],
});

export default function ArabicRegisterPage() {
  return <VendorRegisterContent isRtl />;
}

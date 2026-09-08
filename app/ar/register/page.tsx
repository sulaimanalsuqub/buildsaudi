import { VendorRegisterContent } from "@/components/sections/vendor-register-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar/register",
  title: "انضم كمورد مواد بناء | شبكة توريد بيلد",
  description:
    "سجّل منشأتك كمورد مواد بناء وتشطيب لدى بيلد. فرص توريد لمشاريع إنشائية في المملكة بإجراءات تسجيل واضحة.",
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

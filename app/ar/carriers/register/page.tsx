import { CarrierRegisterContent } from "@/components/sections/carrier-register-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar/carriers/register",
  title: "انضم كناقل مواد بناء | بيلد",
  description: "سجّل أسطولك كشريك نقل لدى بيلد. فرص شحن لتوصيل مواد البناء لمشاريع إنشائية في المملكة.",
  keywords: ["تسجيل ناقل مواد بناء", "شريك نقل مواد بناء", "شركة شحن مواد بناء السعودية"],
});

export default function ArabicCarrierRegisterPage() {
  return <CarrierRegisterContent isRtl />;
}

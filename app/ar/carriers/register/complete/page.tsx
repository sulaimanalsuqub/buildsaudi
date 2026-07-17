import { Suspense } from "react";

import { CarrierCompleteContent } from "@/components/sections/carrier-complete-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar/carriers/register/complete",
  title: "إكمال ملف الناقل | بيلد",
  description: "أكمل بيانات منشأتك كناقل بعد اعتماد طلب التسجيل.",
  noindex: true,
});

export default function ArabicCarrierRegisterCompletePage() {
  return (
    <Suspense fallback={null}>
      <CarrierCompleteContent isRtl />
    </Suspense>
  );
}

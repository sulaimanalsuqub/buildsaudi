import { Suspense } from "react";

import { VendorCompleteContent } from "@/components/sections/vendor-complete-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar/register/complete",
  title: "إكمال بيانات المورد | بيلد",
  description: "أكمل بيانات منشأتك بعد اعتماد طلب التسجيل.",
  noindex: true,
});

export default function ArabicRegisterCompletePage() {
  return (
    <Suspense fallback={null}>
      <VendorCompleteContent isRtl />
    </Suspense>
  );
}
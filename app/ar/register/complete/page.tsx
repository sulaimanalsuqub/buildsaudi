import { Metadata } from "next";
import { Suspense } from "react";

import { VendorCompleteContent } from "@/components/sections/vendor-complete-content";

export const metadata: Metadata = {
  title: "إكمال ملف التوريد",
  description: "أكمل ملف التوريد الخاص بمنشأتك بعد الموافقة على طلب الانضمام إلى بيلد.",
  robots: { index: false, follow: false },
};

export default function ArabicRegisterCompletePage() {
  return (
    <Suspense fallback={null}>
      <VendorCompleteContent isRtl />
    </Suspense>
  );
}
import { Metadata } from "next";
import { Suspense } from "react";

import { VendorCompleteContent } from "@/components/sections/vendor-complete-content";

export const metadata: Metadata = {
  title: "Complete Supply Profile",
  description: "Complete your Build supplier profile after your application is approved.",
  robots: { index: false, follow: false },
};

export default function RegisterCompletePage() {
  return (
    <Suspense fallback={null}>
      <VendorCompleteContent />
    </Suspense>
  );
}
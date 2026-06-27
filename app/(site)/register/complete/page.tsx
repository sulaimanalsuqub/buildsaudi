import { Suspense } from "react";

import { VendorCompleteContent } from "@/components/sections/vendor-complete-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/register/complete",
  title: "Complete Supplier Profile | Build Saudi",
  description: "Complete your company details after your supplier registration has been approved.",
  noindex: true,
});

export default function RegisterCompletePage() {
  return (
    <Suspense fallback={null}>
      <VendorCompleteContent />
    </Suspense>
  );
}
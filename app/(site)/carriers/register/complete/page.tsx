import { Suspense } from "react";

import { CarrierCompleteContent } from "@/components/sections/carrier-complete-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/carriers/register/complete",
  title: "Complete Carrier Profile | Build",
  description: "Complete your carrier profile after your application has been approved.",
  noindex: true,
});

export default function CarrierRegisterCompletePage() {
  return (
    <Suspense fallback={null}>
      <CarrierCompleteContent />
    </Suspense>
  );
}

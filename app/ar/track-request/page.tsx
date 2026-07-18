import { Suspense } from "react";

import { TrackRequestContent } from "@/components/sections/track-request-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar/track-request",
  title: "تتبع طلبكم | بيلد",
  description: "تتبع حالة طلب توريد المواد الخاص بكم.",
  noindex: true,
});

export default function ArabicTrackRequestPage() {
  return (
    <Suspense fallback={null}>
      <TrackRequestContent isRtl />
    </Suspense>
  );
}

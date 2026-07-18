import { Suspense } from "react";

import { TrackRequestContent } from "@/components/sections/track-request-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/track-request",
  title: "Track Your Request | Build Saudi",
  description: "Track the status of your building materials supply request.",
  noindex: true,
});

export default function TrackRequestPage() {
  return (
    <Suspense fallback={null}>
      <TrackRequestContent />
    </Suspense>
  );
}

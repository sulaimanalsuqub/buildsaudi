import { Suspense } from "react";

import { TrackRequestContent } from "@/components/sections/track-request-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "en",
  path: "/track-request",
  title: "Track Your Material Supply Request | Build",
  description: "Find out where your request stands. View the current status and latest updates for your building materials and finishes supply request with Build.",
  noindex: true,
});

export default function TrackRequestPage() {
  return (
    <Suspense fallback={null}>
      <TrackRequestContent />
    </Suspense>
  );
}

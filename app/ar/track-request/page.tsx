import { Suspense } from "react";

import { TrackRequestContent } from "@/components/sections/track-request-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  lang: "ar",
  path: "/ar/track-request",
  title: "تابع حالة طلب التوريد لمشروعك | بيلد",
  description: "اعرف أين وصل طلبك لدى بيلد. اطّلع على حالة طلب توريد مواد البناء والتشطيبات وآخر تحديثاته من صفحة تتبع الطلب.",
  noindex: true,
});

export default function ArabicTrackRequestPage() {
  return (
    <Suspense fallback={null}>
      <TrackRequestContent isRtl />
    </Suspense>
  );
}

import { Suspense } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function ArabicLayout({ children }: { children: React.ReactNode }) {
  return (
    <section dir="rtl" lang="ar">
      <Suspense fallback={<div className="h-[72px]" />}>
        <SiteHeader isRtl />
      </Suspense>
      <div className="pt-[72px]">{children}</div>
      <SiteFooter isRtl />
    </section>
  );
}

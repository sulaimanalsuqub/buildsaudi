import { Suspense } from "react";

import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="h-[72px]" />}>
        <SiteHeader />
      </Suspense>
      <div className="pt-[72px]">{children}</div>
      <ConditionalFooter />
    </>
  );
}

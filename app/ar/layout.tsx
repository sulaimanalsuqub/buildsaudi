import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function ArabicLayout({ children }: { children: React.ReactNode }) {
  return (
    <section dir="rtl" lang="ar">
      <SiteHeader isRtl />
      {children}
      <SiteFooter isRtl />
    </section>
  );
}

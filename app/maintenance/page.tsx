import Image from "next/image";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/site";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-brand-dark" dir="rtl">
      <header className="border-b border-brand-dark/8 bg-white/92 backdrop-blur-xl">
        <Container className="flex h-[72px] items-center justify-between gap-4">
          <Image src="/brand/logo-ar.svg" alt="شعار بيلد" width={4302} height={1500} className="h-11 w-auto" priority />
          <span className="inline-flex h-9 items-center rounded-full border border-brand-dark/12 bg-brand-light px-4 text-sm font-bold text-brand-dark/70">
            صيانة مؤقتة
          </span>
        </Container>
      </header>

      <section className="relative flex flex-1 items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_92%_8%,rgba(197,217,45,.22),transparent_26rem)]" />

        <Container className="relative py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="type-button text-brand-primary">تحديث النظام</p>
            <h1 className="type-hero mt-4 text-brand-dark">
              نعمل على تجهيز تجربة بيلد الجديدة
            </h1>
            <p className="type-body mt-5 max-w-xl text-brand-dark/62">
              سنعود قريبًا برحلة شراء مواد البناء لمشاريعك أسرع وأسهل.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${siteConfig.salesEmail}`}
                className="inline-flex h-12 items-center justify-center rounded-full bg-brand-dark px-6 text-sm font-bold text-white transition hover:bg-brand-primary"
              >
                تواصل معنا
              </a>
              <span dir="ltr" className="type-small text-brand-dark/45">
                {siteConfig.salesEmail}
              </span>
            </div>
          </div>
        </Container>
      </section>

      <footer className="border-t border-brand-dark/8 bg-white">
        <Container className="flex items-center justify-between py-5 type-small text-brand-dark/45">
          <span>© {new Date().getFullYear()} بيلد</span>
          <span dir="ltr">build.sa</span>
        </Container>
      </footer>
    </main>
  );
}

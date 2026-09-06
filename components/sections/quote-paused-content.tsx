import { Mail, Wrench } from "lucide-react";
import { Container } from "@/components/ui/container";

// Temporary pause of customer quote requests (app/api/quotes/register -> Odoo, which is
// currently down for a pending-upgrade lock) — same visual pattern as the earlier supplier
// registration pause, so a customer sees a deliberate notice instead of a request that silently
// fails to reach anyone.
export function QuotePausedContent() {
  return (
    <main dir="rtl">
      <section className="flex min-h-[calc(100svh-72px)] items-center bg-[#f7f9f6] py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
              <Wrench className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="mt-8 text-sm font-bold tracking-[0.16em] text-brand-primary">✦ BUILD</p>
            <p className="mt-3 text-sm font-semibold text-brand-dark/55">طلب عرض سعر</p>
            <h1 className="type-hero mt-5 text-brand-dark">ضغط طلبات، سنعود قريباً جداً</h1>
            <p className="type-subheading mx-auto mt-6 max-w-xl text-brand-dark/65">
              نشهد حالياً ضغطاً على استقبال طلبات التوريد ونعمل على معالجته. نعتذر عن الإيقاف
              المؤقت، وسنعيد فتح الاستقبال قريباً جداً.
            </p>
            <div
              className="mx-auto mt-10 inline-flex max-w-full items-center gap-3 rounded-full border border-brand-dark/10 bg-white px-5 py-3 text-sm font-semibold text-brand-dark shadow-soft"
              dir="ltr"
            >
              <Mail className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
              <span className="sr-only">للاستفسارات والتواصل معنا: </span>
              <a
                href="mailto:sales@build.sa"
                className="hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
              >
                sales@build.sa
              </a>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

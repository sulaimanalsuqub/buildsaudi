import Link from "next/link";
import { ChevronUp, Sparkles } from "lucide-react";

export function BaniEntry() {
  return (
    <section
      className="bani-ai-surface mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-brand-dark/10 shadow-soft"
      aria-labelledby="bani-entry-title"
    >
      <div className="relative z-10 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-sm font-bold tracking-[0.14em] text-brand-primary">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              ✦ BANI
            </p>
            <h2 id="bani-entry-title" className="mt-3 text-2xl font-bold text-brand-dark sm:text-3xl">
              سجّل أسرع مع باني
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-brand-dark/70 sm:text-base">
              خل باني يرتب لك بيانات التسجيل من خلال محادثة قصيرة.
            </p>
          </div>

          <Link
            href="/ar/register/bani"
            className="bani-ai-button group relative min-h-12 w-full overflow-hidden rounded-full px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-dark/10 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 sm:w-auto"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              ابدأ مع BANI ✦
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

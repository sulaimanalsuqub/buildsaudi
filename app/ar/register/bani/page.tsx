import type { Metadata } from "next";
import Link from "next/link";

import { BaniPanel } from "@/components/bani/BaniPanel";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "BANI | تسجيل الموردين"
};

export default function BaniRegistrationPage() {
  return (
    <main className="min-h-screen bg-[#f7f9f6] py-8 md:py-14" dir="rtl">
      <Container>
        <div className="mx-auto max-w-4xl">
          <Link
            href="/ar/register"
            className="mb-5 inline-flex rounded-lg px-2 py-1 text-sm font-semibold text-brand-dark/65 transition hover:bg-brand-dark/5 hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
          >
            ← العودة لتسجيل المورد
          </Link>
          <div className="overflow-hidden rounded-2xl border border-brand-dark/10 bg-white shadow-soft">
            <div className="border-b border-brand-dark/10 px-5 py-5 sm:px-8">
              <p className="text-sm font-bold tracking-[0.14em] text-brand-primary">✦ BANI</p>
              <h1 className="mt-2 text-2xl font-bold text-brand-dark sm:text-3xl">سجّل أسرع مع باني</h1>
              <p className="mt-2 text-sm leading-7 text-brand-dark/65">
                محادثة قصيرة تساعدك في ترتيب بيانات منشأتك.
              </p>
            </div>
            <BaniPanel />
          </div>
        </div>
      </Container>
    </main>
  );
}

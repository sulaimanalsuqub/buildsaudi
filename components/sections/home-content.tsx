"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { Container } from "@/components/ui/container";

type HomeContentProps = {
  isRtl?: boolean;
};

export function HomeContent({ isRtl = false }: HomeContentProps) {
  const t = {
    heroTitle: isRtl ? "أسرع طريقة لتوريد مشاريعكم" : "The Fastest Way to Supply Your Projects",
    heroSub: isRtl
      ? "رحلة مواد البناء أسرع ، أسهل ، أوضح"
      : "A clearer and faster supply workflow for construction projects.",
    primaryCta: isRtl ? "ابدأ التوريد الآن" : "Start Supplying Now",
    secondaryCta: isRtl ? "تحدث مع خبير" : "Talk to an Expert",
    badge: isRtl ? "منصة بيلد لتوريد مواد البناء" : "Build Construction Supply Platform",
    stat1: isRtl ? "طلبات اليوم" : "Today Requests",
    stat2: isRtl ? "موردون نشطون" : "Active Suppliers",
    stat3: isRtl ? "سرعة التوريد" : "Supply Speed"
  };

  return (
    <main>
      <section className="section-pad bg-transparent">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="surface-card relative mx-auto max-w-[1160px] overflow-hidden rounded-[30px] border-brand-dark/12 px-5 py-10 text-center sm:px-8 md:px-12 md:py-14"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_8%_14%,rgba(197,217,45,0.26)_0%,transparent_38%),radial-gradient(circle_at_88%_20%,rgba(9,177,75,0.2)_0%,transparent_40%),radial-gradient(circle_at_78%_84%,rgba(29,63,31,0.14)_0%,transparent_42%),linear-gradient(140deg,rgba(244,243,235,0.96),rgba(255,255,255,0.98))]"
            />

            <div className="relative z-10">
              <p className="type-small mx-auto w-fit rounded-full border border-brand-dark/15 bg-white/70 px-4 py-1.5 font-semibold text-brand-dark/80">
                {t.badge}
              </p>

              <h1 className="type-hero mx-auto mt-8 text-brand-dark">{t.heroTitle}</h1>
              <p className="type-subheading mx-auto mt-8 text-brand-dark/80">{t.heroSub}</p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href={isRtl ? "/ar/register" : "/register"}
                  className="rounded-full bg-brand-primary px-8 py-3 type-button text-white transition-colors hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35"
                >
                  {t.primaryCta}
                </Link>
                <Link
                  href={isRtl ? "/ar/register" : "/register"}
                  className="rounded-full border border-brand-dark/20 bg-white px-8 py-3 type-button text-brand-dark transition-colors hover:border-brand-dark/35 hover:bg-brand-dark/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark/20"
                >
                  {t.secondaryCta}
                </Link>
              </div>
            </div>

            <div className="relative z-10 mx-auto mt-10 max-w-4xl rounded-2xl border border-brand-dark/10 bg-white/92 p-4 shadow-soft md:p-5">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-brand-dark/10 bg-white p-4 text-start">
                  <p className="type-small text-brand-dark/60">{t.stat1}</p>
                  <p className="mt-2 text-2xl font-bold text-brand-dark">128</p>
                </div>
                <div className="rounded-xl border border-brand-dark/10 bg-white p-4 text-start">
                  <p className="type-small text-brand-dark/60">{t.stat2}</p>
                  <p className="mt-2 text-2xl font-bold text-brand-dark">340</p>
                </div>
                <div className="rounded-xl border border-brand-dark/10 bg-white p-4 text-start">
                  <p className="type-small text-brand-dark/60">{t.stat3}</p>
                  <p className="mt-2 text-2xl font-bold text-brand-dark">+42%</p>
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>
    </main>
  );
}

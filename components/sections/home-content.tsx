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
      : "Build connects building material suppliers directly with active projects through a faster, clearer supply workflow.",
    primaryCta: isRtl ? "ابدأ التوريد الآن" : "Start Supplying Now",
    secondaryCta: isRtl ? "ابدأ الآن" : "Get Started"
  };

  return (
    <main>
      <section className="section-pad border-b border-brand-dark/10 bg-transparent">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-[920px] text-center"
          >
            <h1 className="type-hero mx-auto text-brand-dark">{t.heroTitle}</h1>
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
          </motion.div>
        </Container>
      </section>
    </main>
  );
}

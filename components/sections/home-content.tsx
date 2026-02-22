"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { Container } from "@/components/ui/container";

type HomeContentProps = {
  isRtl?: boolean;
};

const features = [
  {
    title: "Verified Vendor Profiles",
    description: "Collect business licenses, VAT records, and compliance details in one secure workflow."
  },
  {
    title: "Smart Qualification",
    description: "Automated checks route qualified suppliers to the right procurement team without delays."
  },
  {
    title: "Faster Procurement",
    description: "Reduce onboarding cycle time with a streamlined, transparent, and trackable registration journey."
  }
];

const steps = [
  "Vendor submits complete company profile",
  "Compliance and capability checks are reviewed",
  "Qualified suppliers become ready for tenders"
];

export function HomeContent({ isRtl = false }: HomeContentProps) {
  const t = {
    heroTitle: isRtl ? "منصة بيلد لتسجيل موردي قطاع البناء" : "Saudi Construction Vendor Registration, Reimagined",
    heroSub: isRtl
      ? "بيلد تُمكن المقاولين والمطورين من تأهيل الموردين بسرعة وشفافية عبر تجربة احترافية متكاملة."
      : "Build gives contractors and developers a premium workflow to register, verify, and activate construction suppliers at scale.",
    primaryCta: isRtl ? "ابدأ تسجيل المورد" : "Start Vendor Registration",
    secondaryCta: isRtl ? "استكشف المنصة" : "Explore Platform",
    featuresTitle: isRtl ? "مزايا مصممة لفرق المشتريات" : "Built for Modern Procurement Teams",
    howTitle: isRtl ? "كيف تعمل بيلد" : "How Build Works",
    trustTitle: isRtl ? "موثوقة لدى فرق المشاريع" : "Trusted by Construction Operations",
    ctaTitle: isRtl ? "حوّل تسجيل الموردين إلى ميزة تنافسية" : "Turn Vendor Onboarding Into a Strategic Advantage",
    ctaSub: isRtl
      ? "ابدأ اليوم وامنح فريقك تجربة تسجيل سريعة وواضحة وقابلة للتوسع."
      : "Launch a best-in-class registration journey with compliance-first structure and premium UX."
  };

  return (
    <main>
      <section className="bg-hero-gradient pb-16 pt-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <h1 className="type-hero text-brand-dark">{t.heroTitle}</h1>
            <p className="type-subheading mt-6 text-brand-dark/80">{t.heroSub}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href={isRtl ? "/ar/register" : "/register"} className="rounded-full bg-brand-dark px-8 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-brand-primary">
                {t.primaryCta}
              </Link>
              <Link href="#features" className="rounded-full border border-brand-dark/20 bg-white px-8 py-3 text-base font-medium text-brand-dark transition hover:border-brand-primary hover:text-brand-primary">
                {t.secondaryCta}
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      <section id="features" className="pt-16">
        <Container>
          <h2 className="type-section-title text-brand-dark">{t.featuresTitle}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="rounded-xl border border-brand-dark/10 bg-white p-6 shadow-soft"
              >
                <h3 className="text-xl font-semibold text-brand-dark">{feature.title}</h3>
                <p className="type-body mt-3 text-brand-dark/75">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </Container>
      </section>

      <section id="how-it-works" className="pt-16">
        <Container>
          <h2 className="type-section-title text-brand-dark">{t.howTitle}</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, idx) => (
              <li key={step} className="rounded-xl bg-brand-light p-6 shadow-soft">
                <p className="text-sm font-semibold text-brand-primary">Step {idx + 1}</p>
                <p className="type-body mt-2 text-brand-dark">{step}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section id="trust" className="pt-16">
        <Container>
          <div className="rounded-xl border border-brand-dark/10 bg-white p-8 shadow-soft md:p-10">
            <h2 className="type-section-title text-brand-dark">{t.trustTitle}</h2>
            <p className="type-body mt-4 max-w-3xl text-brand-dark/75">
              {isRtl
                ? "مصممة للسوق السعودي، وتلائم متطلبات الامتثال، وتمنح فرقك رؤية كاملة على حالة كل مورد من بداية التسجيل حتى التفعيل."
                : "Purpose-built for Saudi market standards, with complete auditability, clean records, and transparent status across every vendor application."}
            </p>
          </div>
        </Container>
      </section>

      <section className="pt-16">
        <Container>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-xl bg-cta-gradient p-8 text-white shadow-premium md:p-12"
          >
            <h2 className="type-section-title">{t.ctaTitle}</h2>
            <p className="type-subheading mt-4 max-w-3xl text-white/90">{t.ctaSub}</p>
            <Link
              href={isRtl ? "/ar/register" : "/register"}
              className="mt-8 inline-block rounded-full bg-white px-8 py-3 text-base font-semibold text-brand-dark transition hover:bg-brand-light"
            >
              {t.primaryCta}
            </Link>
          </motion.div>
        </Container>
      </section>
    </main>
  );
}

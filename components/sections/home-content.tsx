"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { Container } from "@/components/ui/container";

type HomeContentProps = {
  isRtl?: boolean;
};

export function HomeContent({ isRtl = false }: HomeContentProps) {
  const features = isRtl
    ? [
        {
          title: "وصول أسرع للمشاريع",
          description: "اعرض منتجاتك مباشرة أمام الجهات المنفذة للمشاريع في وقت أقصر."
        },
        {
          title: "طلبات واضحة",
          description: "استقبل احتياج المشروع بشكل منظم لتقدّم عرضك بسرعة وبوضوح."
        },
        {
          title: "توريد أكثر كفاءة",
          description: "اختصر دورة التوريد من أول تواصل حتى تسليم المواد للموقع."
        }
      ]
    : [
        {
          title: "Faster Project Access",
          description: "Show your products directly to active construction projects with less delay."
        },
        {
          title: "Clear Demand Requests",
          description: "Receive structured project requirements so you can respond quickly and accurately."
        },
        {
          title: "Efficient Supply Cycle",
          description: "Shorten the supply cycle from initial request to material delivery on site."
        }
      ];

  const steps = isRtl
    ? [
        "تسجّل بيانات شركتك ومنتجاتك الأساسية",
        "تستقبل فرص توريد مناسبة لنطاقك ومناطقك",
        "تبدأ التوريد للمشاريع بسرعة وسلاسة"
      ]
    : [
        "Create your supplier profile with core product data",
        "Receive matching supply opportunities by region and category",
        "Deliver to projects faster with a clear workflow"
      ];

  const t = {
    heroTitle: isRtl ? "أسرع طريقة لتوريد منتجاتك لمشاريع البناء" : "The Fastest Way to Supply Your Products to Construction Projects",
    heroSub: isRtl
      ? "بيلد تربط موردي مواد البناء بالمشاريع مباشرة عبر مسار واضح وسريع يختصر وقت الوصول إلى فرص التوريد."
      : "Build connects building material suppliers directly with active projects through a faster, clearer supply workflow.",
    primaryCta: isRtl ? "ابدأ التوريد الآن" : "Start Supplying Now",
    secondaryCta: isRtl ? "كيف تعمل" : "How it works",
    featuresTitle: isRtl ? "مزايا لموردي مواد البناء" : "Built for Building Material Suppliers",
    howTitle: isRtl ? "كيف تعمل بيلد" : "How Build Works",
    trustTitle: isRtl ? "موثوقة لدى المشاريع والموردين" : "Trusted by Projects and Suppliers",
    ctaTitle: isRtl ? "اجعل توريد منتجاتك أسرع وأسهل" : "Make Your Product Supply Faster and Easier",
    ctaSub: isRtl
      ? "ابدأ اليوم ووسّع وصول منتجاتك لمشاريع أكثر عبر مسار توريد واضح."
      : "Start today and expand your product reach to more projects with a clear supply workflow."
  };

  return (
    <main>
      <section className="border-b border-brand-dark/10 bg-white pb-16 pt-16 md:pt-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-5xl text-center"
          >
            <h1 className="type-hero text-brand-dark">{t.heroTitle}</h1>
            <p className="type-subheading mx-auto mt-6 max-w-3xl text-brand-dark/75">{t.heroSub}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href={isRtl ? "/ar/register" : "/register"} className="rounded-full bg-brand-dark px-8 py-3 text-base font-semibold text-white transition hover:bg-brand-dark/90">
                {t.primaryCta}
              </Link>
              <Link href="#how-it-works" className="rounded-full border border-brand-dark/20 bg-white px-8 py-3 text-base font-medium text-brand-dark transition hover:border-brand-dark/40">
                {t.secondaryCta}
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      <section id="features" className="pt-16 md:pt-20">
        <Container>
          <h2 className="type-section-title text-brand-dark">{t.featuresTitle}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="rounded-xl border border-brand-dark/10 bg-white p-6"
              >
                <h3 className="text-xl font-semibold tracking-tight text-brand-dark">{feature.title}</h3>
                <p className="type-body mt-3 text-brand-dark/75">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </Container>
      </section>

      <section id="how-it-works" className="pt-16 md:pt-20">
        <Container>
          <h2 className="type-section-title text-brand-dark">{t.howTitle}</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, idx) => (
              <li key={step} className="rounded-xl border border-brand-dark/10 bg-white p-6">
                <p className="text-sm font-semibold text-brand-dark/55">{`0${idx + 1}`}</p>
                <p className="type-body mt-2 text-brand-dark/90">{step}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

    </main>
  );
}

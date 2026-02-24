"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { Container } from "@/components/ui/container";

type HomeContentProps = {
  isRtl?: boolean;
};

const categories = [
  {
    en: "Building Materials",
    ar: "مواد بناء وإنشاء",
    icon: "🏗️",
  },
  {
    en: "Safety Tools",
    ar: "أدوات السلامة",
    icon: "🦺",
  },
  {
    en: "Paint & Decor",
    ar: "دهانات وديكور",
    icon: "🎨",
  },
  {
    en: "Electrical & Lighting",
    ar: "كهرباء وإنارة",
    icon: "💡",
  },
  {
    en: "Plumbing",
    ar: "سباكة",
    icon: "🔧",
  },
  {
    en: "Sanitary Ware",
    ar: "أدوات صحية",
    icon: "🚿",
  },
  {
    en: "HVAC",
    ar: "تكييف وتبريد",
    icon: "❄️",
  },
  {
    en: "Piping Systems",
    ar: "أنظمة الأنابيب",
    icon: "🔩",
  },
  {
    en: "Pumps & Tanks",
    ar: "مضخات وخزانات",
    icon: "🛢️",
  },
  {
    en: "Flooring & Ceramics",
    ar: "أرضيات وسيراميك",
    icon: "🪨",
  },
  {
    en: "Insulation",
    ar: "عوازل",
    icon: "🧱",
  },
  {
    en: "Adhesives",
    ar: "مواد لاصقة",
    icon: "🔗",
  },
];

export function HomeContent({ isRtl = false }: HomeContentProps) {
  const t = {
    heroTitle: isRtl ? "أسرع طريقة لتوريد مشاريعكم" : "The Fastest Way to Supply Your Projects",
    heroSub: isRtl
      ? "رحلة البناء أسهل وأسرع"
      : "A clearer and faster supply workflow for construction projects.",
    primaryCta: isRtl ? "ابدأ التوريد الآن" : "Start Supplying Now",
    secondaryCta: isRtl ? "تحدث مع خبير" : "Talk to an Expert",
    badge: isRtl ? "أسرع طريق لتوريد منتجات البناء" : "Build Construction Supply Platform",
    stat1: isRtl ? "طلبات اليوم" : "Today Requests",
    stat2: isRtl ? "موردون نشطون" : "Active Suppliers",
    stat3: isRtl ? "سرعة التوريد" : "Supply Speed",
    categoriesTitle: isRtl ? "فئات التوريد" : "Supply Categories",
    categoriesSub: isRtl
      ? "حلول متكاملة من منتجات البناء والتشطيب"
      : "We connect you with specialized suppliers across all construction material categories",
    howTitle: isRtl ? "كيف نشتغل؟" : "How Build Works",
    howSub: isRtl
      ? "ثلاث خطوات بسيطة من الطلب إلى التسليم"
      : "Three simple steps from request to delivery",
    steps: isRtl
      ? [
          {
            number: "01",
            title: "أرسل طلبك",
            desc: "حدد المواد والكميات التي يحتاجها مشروعك وأرسل الطلب عبر المنصة",
            icon: "📋",
          },
          {
            number: "02",
            title: "استلم عرض السعر",
            desc: "يصلك عرض سعر نهائي وشامل من بيلد خلال وقت قصير",
            icon: "💰",
          },
          {
            number: "03",
            title: "استلم موادك في الموقع",
            desc: "بعد الموافقة على العرض، نتولى الشحن والتوصيل مباشرة إلى موقع مشروعك",
            icon: "🚚",
          },
        ]
      : [
          {
            number: "01",
            title: "Submit Your Request",
            desc: "Specify the materials and quantities your project needs and submit through the platform",
            icon: "📋",
          },
          {
            number: "02",
            title: "Receive a Quote",
            desc: "Get a comprehensive final price quote from Build in a short time",
            icon: "💰",
          },
          {
            number: "03",
            title: "Receive at Your Site",
            desc: "Once you approve the quote, we handle shipping and delivery directly to your project site",
            icon: "🚚",
          },
        ],
  };

  return (
    <main>
      {/* Hero Section */}
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
                  href={isRtl ? "/ar/auth/sign-in" : "/auth/sign-in"}
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

      {/* How It Works Section */}
      <section className="section-pad bg-transparent" dir={isRtl ? "rtl" : "ltr"}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <div className="mb-12 text-center">
              <h2 className="type-section-title mx-auto text-brand-dark">{t.howTitle}</h2>
              <p className="type-body mx-auto mt-3 text-brand-dark/65">{t.howSub}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {t.steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.1 }}
                  className="surface-card relative flex flex-col gap-4 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{step.icon}</span>
                    <span className="text-4xl font-bold text-brand-dark/8 select-none">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="type-card-title text-brand-dark">{step.title}</h3>
                    <p className="type-small mt-2 text-brand-dark/65 leading-relaxed">{step.desc}</p>
                  </div>
                  {index < t.steps.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="absolute -end-3 top-1/2 hidden -translate-y-1/2 text-brand-primary/40 md:block"
                    >
                      {isRtl ? "←" : "→"}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Categories Section */}
      <section className="section-pad bg-transparent" dir={isRtl ? "rtl" : "ltr"}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <div className="mb-10 text-center">
              <h2 className="type-section-title mx-auto text-brand-dark">{t.categoriesTitle}</h2>
              <p className="type-body mx-auto mt-3 text-brand-dark/65">{t.categoriesSub}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.en}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="surface-card group flex flex-col gap-3 rounded-2xl p-4 transition-shadow hover:shadow-soft"
                >
                  <span className="text-2xl">{category.icon}</span>
                  <p className="type-small font-semibold text-brand-dark leading-snug">
                    {isRtl ? category.ar : category.en}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>
    </main>
  );
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { Container } from "@/components/ui/container";

type HomeContentProps = {
  isRtl?: boolean;
};

const categories = [
  { en: "Building Materials", ar: "مواد بناء وإنشاء", icon: "🏗️" },
  { en: "Safety Tools", ar: "أدوات السلامة", icon: "🦺" },
  { en: "Paint & Decor", ar: "دهانات وديكور", icon: "🎨" },
  { en: "Electrical & Lighting", ar: "كهرباء وإنارة", icon: "💡" },
  { en: "Plumbing", ar: "سباكة", icon: "🔧" },
  { en: "Sanitary Ware", ar: "أدوات صحية", icon: "🚿" },
  { en: "HVAC", ar: "تكييف وتبريد", icon: "❄️" },
  { en: "Piping Systems", ar: "أنظمة الأنابيب", icon: "🔩" },
  { en: "Pumps & Tanks", ar: "مضخات وخزانات", icon: "🛢️" },
  { en: "Flooring & Ceramics", ar: "أرضيات وسيراميك", icon: "🪨" },
  { en: "Insulation", ar: "عوازل", icon: "🧱" },
  { en: "Adhesives", ar: "مواد لاصقة", icon: "🔗" },
];

export function HomeContent({ isRtl = false }: HomeContentProps) {
  const t = {
    heroTitle: isRtl ? "أسرع طريقة لتوريد مشاريعكم" : "The Fastest Way to Supply Your Projects",
    heroSub: isRtl
      ? "رحلة البناء أسهل وأسرع"
      : "A clearer and faster supply workflow for construction projects.",
    primaryCta: isRtl ? "اطلب المنتجات" : "Order Products",
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
    ctaTitle: isRtl ? "جاهز تبدأ توريد مشروعك؟" : "Ready to Supply Your Project?",
    ctaSub: isRtl
      ? "سجّل الآن وابدأ باستقبال عروض الأسعار لمشاريعك"
      : "Register now and start receiving quotes for your projects",
    ctaBtn: isRtl ? "سجّل كمورد" : "Register as Vendor",
    steps: isRtl
      ? [
          {
            title: "أرسل طلبك",
            desc: "حدد المواد والكميات التي يحتاجها مشروعك وأرسل الطلب عبر المنصة",
            icon: "📋",
          },
          {
            title: "استلم عرض السعر",
            desc: "يصلك عرض سعر نهائي وشامل من بيلد خلال وقت قصير",
            icon: "💰",
          },
          {
            title: "استلم موادك في الموقع",
            desc: "بعد الموافقة على العرض، نتولى الشحن والتوصيل مباشرة إلى موقع مشروعك",
            icon: "🚚",
          },
        ]
      : [
          {
            title: "Submit Your Request",
            desc: "Specify the materials and quantities your project needs and submit through the platform",
            icon: "📋",
          },
          {
            title: "Receive a Quote",
            desc: "Get a comprehensive final price quote from Build in a short time",
            icon: "💰",
          },
          {
            title: "Receive at Your Site",
            desc: "Once you approve the quote, we handle shipping and delivery directly to your project site",
            icon: "🚚",
          },
        ],
  };

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>

      {/* ── Hero ── */}
      <section className="py-6 md:py-10">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto max-w-[1160px] overflow-hidden rounded-[32px] border border-brand-dark/10 bg-white/80 px-5 py-14 text-center shadow-soft backdrop-blur-sm sm:px-8 md:px-16 md:py-20"
          >
            {/* background gradient */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_8%_14%,rgba(197,217,45,0.18)_0%,transparent_40%),radial-gradient(circle_at_88%_20%,rgba(9,177,75,0.14)_0%,transparent_42%),radial-gradient(circle_at_78%_84%,rgba(29,63,31,0.09)_0%,transparent_44%)]"
            />

            <div className="relative z-10">
              {/* badge */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="type-small mx-auto w-fit rounded-full border border-brand-primary/30 bg-brand-primary/[0.08] px-4 py-1.5 font-semibold text-brand-primary"
              >
                {t.badge}
              </motion.p>

              {/* headline */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.18 }}
                className="type-hero mx-auto mt-5 text-brand-dark"
              >
                {t.heroTitle}
              </motion.h1>

              {/* subheading */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.26 }}
                className="type-subheading mx-auto mt-4 max-w-xl text-brand-dark/60"
              >
                {t.heroSub}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.34 }}
                className="mt-7 flex flex-wrap items-center justify-center gap-3"
              >
                <Link
                  href={isRtl ? "/ar/auth/sign-in" : "/auth/sign-in"}
                  className="rounded-full bg-brand-primary px-8 py-3.5 type-button text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
                >
                  {t.primaryCta}
                </Link>
                <Link
                  href={isRtl ? "/ar/register" : "/register"}
                  className="rounded-full border border-brand-dark/20 bg-white px-8 py-3.5 type-button text-brand-dark transition-all hover:border-brand-dark/40 hover:bg-brand-dark/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark/20"
                >
                  {t.secondaryCta}
                </Link>
              </motion.div>
            </div>

            {/* stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.42 }}
              className="relative z-10 mx-auto mt-10 max-w-2xl rounded-2xl border border-brand-dark/10 bg-white/90 p-3 shadow-soft backdrop-blur-sm md:p-4"
            >
              <div className="grid grid-cols-3 divide-x divide-brand-dark/[0.08] rtl:divide-x-reverse">
                {[
                  { label: t.stat1, value: "128" },
                  { label: t.stat2, value: "340" },
                  { label: t.stat3, value: "+42%" },
                ].map((stat) => (
                  <div key={stat.label} className="px-4 py-2.5 text-center">
                    <p className="type-small text-brand-dark/50">{stat.label}</p>
                    <p className="mt-0.5 text-[22px] font-bold tracking-tight text-brand-dark md:text-2xl">{stat.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* ── How It Works ── */}
      <section className="py-14 md:py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <div className="mb-10 text-center">
              <h2 className="type-section-title mx-auto text-brand-dark">{t.howTitle}</h2>
              <p className="type-body mx-auto mt-3 text-brand-dark/55">{t.howSub}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {t.steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.12 }}
                  className="flex flex-col items-center gap-5 rounded-[24px] border border-brand-dark/10 bg-white p-7 text-center shadow-soft"
                >
                  {/* icon circle */}
                  <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border border-brand-primary/20 bg-gradient-to-br from-brand-primary/[0.10] to-brand-accent/[0.10]">
                    <span className="text-[28px] leading-none">{step.icon}</span>
                    <span className="absolute -end-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-[11px] font-bold text-white shadow-sm">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="type-card-title text-brand-dark">{step.title}</h3>
                    <p className="type-small mt-2 leading-relaxed text-brand-dark/55">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ── Categories ── */}
      <section className="py-14 md:py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <div className="mb-10 text-center">
              <h2 className="type-section-title mx-auto text-brand-dark">{t.categoriesTitle}</h2>
              <p className="type-body mx-auto mt-3 text-brand-dark/55">{t.categoriesSub}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.en}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.28, delay: index * 0.04 }}
                  className="group flex items-center gap-3 rounded-[20px] border border-brand-dark/10 bg-white p-4 shadow-soft transition-all hover:border-brand-primary/30 hover:shadow-[0_8px_24px_rgba(9,177,75,0.10)]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/[0.08] text-xl transition-colors group-hover:bg-brand-primary/[0.14]">
                    {category.icon}
                  </div>
                  <p className="type-small font-semibold leading-snug text-brand-dark">
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

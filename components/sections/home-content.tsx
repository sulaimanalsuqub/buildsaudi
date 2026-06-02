"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Cable,
  ClipboardList,
  Droplets,
  Fan,
  HardHat,
  LampCeiling,
  Package,
  Paintbrush,
  ShieldCheck,
  Truck,
  Warehouse,
} from "lucide-react";

import { Container } from "@/components/ui/container";

type HomeContentProps = {
  isRtl?: boolean;
};

type CatalogItem = {
  en: string;
  ar: string;
  descEn: string;
  descAr: string;
  icon: typeof Box;
};

type Step = {
  en: string;
  ar: string;
  descEn: string;
  descAr: string;
  icon: typeof Box;
};

export function HomeContent({ isRtl = false }: HomeContentProps) {
  const catalog: CatalogItem[] = [
    { en: "Building Materials", ar: "مواد البناء", descEn: "Cement, steel, blocks & more", descAr: "إسمنت، حديد، بلوك وغيرها", icon: Warehouse },
    { en: "Safety Tools", ar: "أدوات السلامة", descEn: "PPE, barriers & safety gear", descAr: "معدات الحماية الشخصية", icon: HardHat },
    { en: "Electrical & Lighting", ar: "الكهرباء والإنارة", descEn: "Wiring, fixtures & LED systems", descAr: "أسلاك وتركيبات وأنظمة LED", icon: LampCeiling },
    { en: "Plumbing", ar: "السباكة", descEn: "Pipes, fittings & valves", descAr: "أنابيب وتركيبات وصمامات", icon: Droplets },
    { en: "Sanitary Ware", ar: "الأدوات الصحية", descEn: "Fixtures, faucets & bathroom sets", descAr: "تركيبات ومجموعات الحمام", icon: ShieldCheck },
    { en: "HVAC", ar: "التكييف والتهوية", descEn: "AC units, ventilation & ducting", descAr: "وحدات تكييف وتهوية وقنوات", icon: Fan },
    { en: "Paint & Decor", ar: "الدهانات والتشطيبات", descEn: "Interior, exterior & specialty paints", descAr: "دهانات داخلية وخارجية ومتخصصة", icon: Paintbrush },
    { en: "Piping Systems", ar: "أنظمة الأنابيب", descEn: "Industrial & civil piping solutions", descAr: "حلول الأنابيب الصناعية والمدنية", icon: Cable },
  ];

  const steps: Step[] = [
    {
      en: "Submit Requirements",
      ar: "أرسل احتياجاتك",
      descEn: "Upload your BOQ and project specifications through our simple form.",
      descAr: "ارفع جدول الكميات ومواصفات مشروعك عبر نموذجنا البسيط.",
      icon: ClipboardList,
    },
    {
      en: "We Prepare Your Quote",
      ar: "نجهّز عرض السعر",
      descEn: "We review your requirements and prepare a comprehensive price quote for your project.",
      descAr: "نراجع احتياجاتك ونجهّز عرض سعر شاملاً لمشروعك في أسرع وقت.",
      icon: Package,
    },
    {
      en: "Delivered On-Site",
      ar: "التسليم في الموقع",
      descEn: "Materials are delivered directly to your project location across KSA.",
      descAr: "تُسلَّم المواد مباشرةً في موقع مشروعك في أنحاء المملكة.",
      icon: Truck,
    },
  ];

  const t = {
    eyebrow: isRtl ? "بيلد لتوريد مواد البناء" : "Build Construction Supply",
    title: isRtl ? "أسرع طريق لتوريد مشروعك" : "The fastest way to supply your project",
    body: isRtl
      ? "اطلب احتياج المشروع، أرفق جدول الكميات، وحدد موقع التسليم."
      : "Submit your BOQ, set the delivery location, and we handle the rest.",
    // Action cards
    card1Title: isRtl ? "أطلب المنتجات" : "Order Products",
    card1Sub: isRtl ? "أرسل احتياج مشروعك وجدول الكميات" : "Send your project requirements and BOQ",
    card1Cta: isRtl ? "ابدأ الآن" : "Get Started",
    card2Title: isRtl ? "توصيل لكل المملكة" : "Nationwide Delivery",
    card2Sub: isRtl ? "نوصّل مواد مشروعك مباشرةً لموقعك في أي منطقة بالمملكة" : "We deliver your materials directly to your site anywhere in Saudi Arabia",
    card2Cta: isRtl ? "اطلب الآن" : "Order Now",
    // Sections
    catalogLabel: isRtl ? "الكتالوج" : "Catalog",
    catalogTitle: isRtl ? "الفئات المتوفرة" : "Available Categories",
    catalogSub: isRtl
      ? "فئات رئيسية لجميع احتياجات مشاريعك"
      : "We supply construction materials across eight major categories for all your project needs",
    processLabel: isRtl ? "العملية" : "Process",
    howTitle: isRtl ? "كيف نشتغل؟" : "How We Work",
    howSub: isRtl
      ? "ثلاث خطوات بسيطة لتأمين مواد مشروعك"
      : "Three simple steps to secure your project materials",
    ctaTitle: isRtl ? "جاهز لتوريد مشروعك؟" : "Ready to supply your project?",
    ctaBody: isRtl
      ? "أرسل احتياجاتك اليوم وسنتولى ترتيب التوريد."
      : "Submit your requirements today and we'll coordinate supply.",
    primary: isRtl ? "أطلب المنتجات" : "Order Products",
  };

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pb-20 pt-24 md:pb-32 md:pt-40">

        <Container className="relative">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">

            {/* Text Section (Right side in RTL) */}
            <div className="flex flex-col items-center md:items-start text-center md:text-start">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="type-hero text-brand-dark leading-[1.1]">
                  {isRtl ? (
                    <>
                      أسرع طريق لتوريد <br />
                      <span className="text-brand-primary">مشروعك الإنشائي</span>
                    </>
                  ) : (
                    <>
                      The fastest way to supply <br />
                      <span className="text-brand-primary">Your Project</span>
                    </>
                  )}
                </h1>
                <p className="type-subheading mt-6 max-w-xl text-brand-dark/70">
                  {t.body}
                </p>

                <div className="mt-10">
                  <Link
                    href={isRtl ? "/ar/get-quote" : "/get-quote"}
                    className="inline-flex h-14 items-center justify-center rounded-full bg-brand-primary px-10 text-lg font-bold text-white transition hover:bg-brand-dark"
                  >
                    {t.primary}
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Image Section (Left side in RTL) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-brand-dark/10 bg-brand-light md:aspect-square md:rounded-[3rem]">
                <Image
                  src="/images/buildman.png"
                  alt={isRtl ? "توريد مواد البناء" : "Construction supply"}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Floating Stat Card — مخفي على الجوال لتفادي الـ overflow */}
              <div className="absolute -bottom-6 -inline-start-6 hidden rounded-2xl border border-brand-dark/10 bg-white p-6 md:flex">
                <div className="flex items-center gap-4">
                  <Image
                    src="/images/build-icon.png"
                    alt={isRtl ? "أيقونة بيلد" : "Build icon"}
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-bold text-brand-dark">{isRtl ? "موثوقية كاملة" : "Full Reliability"}</p>
                    <p className="text-xs text-brand-dark/60">{isRtl ? "توصيل آمن للمواقع" : "Secure Site Delivery"}</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </Container>
      </section>

      {/* ── Catalog ──────────────────────────────────── */}
      <section className="bg-brand-light py-20 md:py-32">
        <Container>
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl"
            >
              <h2 className="text-3xl font-black tracking-tight text-brand-dark md:text-5xl">
                {t.catalogTitle}
              </h2>
              <p className="mt-4 text-lg text-brand-dark/60">
                {t.catalogSub}
              </p>
            </motion.div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {catalog.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.en}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-brand-dark/10 bg-white p-8 transition-all"
                >
                  <div className="relative z-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand-primary transition-colors">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-brand-dark">{isRtl ? item.ar : item.en}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-dark/50">{isRtl ? item.descAr : item.descEn}</p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section id="how-it-works" className="py-20 md:py-32">
        <Container>
          <div className="flex flex-col items-center text-center">
            <h2 className="text-3xl font-black tracking-tight text-brand-dark md:text-5xl">
              {t.howTitle}
            </h2>
            <p className="mt-4 text-lg text-brand-dark/60">
              {t.howSub}
            </p>
          </div>

          <div className="relative mt-16 grid gap-6 md:grid-cols-3">
            {/* Connecting line behind cards */}
            <div className="absolute top-14 hidden h-[2px] bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent md:inset-x-[15%] md:block" />

            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.en}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative flex flex-col items-center rounded-3xl border border-brand-dark/8 bg-white p-8 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="absolute end-0 top-14 hidden -translate-y-1/2 translate-x-1/2 text-brand-primary/30 md:block">
                      <ArrowRight className={`h-5 w-5 ${isRtl ? "rotate-180" : ""}`} />
                    </div>
                  )}
                  <h3 className="mt-5 text-lg font-bold text-brand-dark">{isRtl ? s.ar : s.en}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-dark/55">
                    {isRtl ? s.descAr : s.descEn}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── Final CTA ────────────────────────────────── */}
      <section className="pb-20 pt-10 md:pb-32">
        <Container>
          <div className="relative overflow-hidden rounded-2xl bg-brand-dark px-8 py-16 text-center md:rounded-[3rem] md:px-16 md:py-24">
            
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="text-3xl font-black text-white md:text-5xl">{t.ctaTitle}</h2>
              <p className="mt-6 text-lg text-white/70">{t.ctaBody}</p>
              <div className="mt-10">
                <Link
                  href={isRtl ? "/ar/get-quote" : "/get-quote"}
                  className="inline-flex h-14 items-center justify-center rounded-full bg-brand-primary px-10 text-lg font-bold text-brand-dark transition hover:bg-white"
                >
                  {t.card1Cta}
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

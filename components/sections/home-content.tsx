"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Cable,
  ClipboardList,
  Droplets,
  Fan,
  FileText,
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
  step: string;
};

export function HomeContent({ isRtl = false }: HomeContentProps) {
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

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
      step: "01",
    },
    {
      en: "We Prepare Your Quote",
      ar: "نجهّز عرض السعر",
      descEn: "We review your requirements and prepare a comprehensive price quote for your project.",
      descAr: "نراجع احتياجاتك ونجهّز عرض سعر شاملاً لمشروعك في أسرع وقت.",
      icon: Package,
      step: "02",
    },
    {
      en: "Delivered On-Site",
      ar: "التسليم في الموقع",
      descEn: "Materials are delivered directly to your project location across KSA.",
      descAr: "تُسلَّم المواد مباشرةً في موقع مشروعك في أنحاء المملكة.",
      icon: Truck,
      step: "03",
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
      ? "نوفر مواد البناء عبر ثماني فئات رئيسية لجميع احتياجات مشاريعك"
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
    <main dir={isRtl ? "rtl" : "ltr"} className="transition-colors dark:bg-brand-dark">

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20 lg:py-24 dark:bg-brand-dark">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="type-hero text-brand-dark dark:text-brand-light">
              {isRtl ? "أسرع طريق لتوريد مشروعك" : "The fastest way to supply your project"}
            </h1>
            <p className="type-subheading mx-auto mt-5 max-w-lg text-brand-dark/62 dark:text-brand-light/60" aria-label={t.body}>
              {t.body.split("،").map((part, i, arr) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.25, ease: "easeOut" }}
                  className="inline dark:text-brand-light/70"
                >
                  {part.trim()}{i < arr.length - 1 ? "، " : ""}
                </motion.span>
              ))}
            </p>
          </div>
        </Container>
      </section>

      {/* ── Action cards ─────────────────────────────── */}
      <section className="pb-16 md:pb-20 dark:bg-brand-dark">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2">

            {/* Card 1 — Order Products */}
            <Link
              href={isRtl ? "/ar/get-quote" : "/get-quote"}
              className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-3xl bg-brand-dark p-8 md:min-h-[340px] md:p-10 dark:bg-white/5 dark:border dark:border-white/10"
            >

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white dark:bg-white/10">
                  <FileText className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-white md:text-3xl dark:text-brand-light">{t.card1Title}</h2>
                <p className="mt-2 text-base text-white/70 dark:text-brand-light/60">{t.card1Sub}</p>
              </div>

              <div className="relative mt-8 flex items-center justify-between">
                <span className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-brand-dark transition group-hover:bg-brand-light dark:bg-brand-primary dark:text-white dark:group-hover:bg-brand-primary/90">
                  {t.card1Cta}
                  <ArrowIcon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </Link>

            {/* Card 2 — Nationwide Delivery */}
            <Link
              href={isRtl ? "/ar/get-quote" : "/get-quote"}
              className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-3xl border border-brand-dark/10 bg-brand-light p-8 md:min-h-[340px] md:p-10 dark:bg-white/5 dark:border-white/10"
            >

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-brand-light">
                  <Truck className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-brand-dark md:text-3xl dark:text-brand-light">{t.card2Title}</h2>
                <p className="mt-2 text-base text-brand-dark/60 dark:text-brand-light/60">{t.card2Sub}</p>
              </div>

              <div className="relative mt-8 flex items-center justify-between">
                <span className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-dark px-6 text-sm font-bold text-white transition group-hover:bg-brand-primary dark:bg-white dark:text-brand-dark dark:group-hover:bg-brand-light">
                  {t.card2Cta}
                  <ArrowIcon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </Link>

          </div>
        </Container>
      </section>

      {/* ── Catalog ──────────────────────────────────── */}
      <section className="bg-[#f7f9f6] py-16 md:py-20 dark:bg-white/5">
        <Container>
          <div className="text-center">
            <h2 className="type-section-title mx-auto text-brand-dark dark:text-brand-light">{t.catalogTitle}</h2>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {catalog.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.en}
                  className="group rounded-2xl border border-brand-dark/8 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand-primary/20 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand-primary transition group-hover:bg-brand-primary/10 dark:bg-white/10">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-[15px] font-bold text-brand-dark dark:text-brand-light">{isRtl ? item.ar : item.en}</p>
                  <p className="mt-1.5 text-[13px] leading-5 text-brand-dark/52 dark:text-brand-light/50">{isRtl ? item.descAr : item.descEn}</p>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section className="py-16 md:py-20 dark:bg-brand-dark">
        <Container>
          <div className="text-center">
            <h2 className="type-section-title mx-auto text-brand-dark dark:text-brand-light">{t.howTitle}</h2>
          </div>

          <div className="mt-12 grid gap-0 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.en} className="relative flex flex-col items-center text-center px-6 py-8">
                  {/* connector line */}
                  {index < steps.length - 1 && (
                    <span className="hidden md:block absolute top-[2.75rem] start-[calc(50%+2rem)] end-0 h-px bg-brand-primary/20 dark:bg-brand-primary/10" />
                  )}
                  {/* step number + icon */}
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-dark text-white dark:bg-white/10 dark:text-brand-light">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                    <span className="absolute -top-2 -end-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-[11px] font-black text-white">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[17px] font-bold text-brand-dark dark:text-brand-light">{isRtl ? step.ar : step.en}</h3>
                  <p className="mt-2 text-sm leading-6 text-brand-dark/55 max-w-[200px] dark:text-brand-light/50">{isRtl ? step.descAr : step.descEn}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>


    </main>
  );
}

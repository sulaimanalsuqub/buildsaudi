"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AuroraText } from "@/components/ui/aurora-text";
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
    howTitle: isRtl ? "كيف يعمل بيلد؟" : "How Build Works",
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
      <section className="bg-white py-16 md:py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="type-hero text-brand-dark">
              {isRtl ? "أسرع طريق لتوريد مشروعك" : "The fastest way to supply your project"}
            </h1>
            <p className="type-subheading mx-auto mt-5 max-w-lg text-brand-dark/62" aria-label={t.body}>
              {t.body.split("،").map((part, i, arr) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.25, ease: "easeOut" }}
                  className="inline"
                >
                  {part.trim()}{i < arr.length - 1 ? "، " : ""}
                </motion.span>
              ))}
            </p>
          </div>
        </Container>
      </section>

      {/* ── Action cards ─────────────────────────────── */}
      <section className="pb-16 md:pb-20">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2">

            {/* Card 1 — Order Products */}
            <Link
              href={isRtl ? "/ar/get-quote" : "/get-quote"}
              className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-3xl p-8 md:min-h-[340px] md:p-10"
              style={{ background: "linear-gradient(135deg, #1D3F1F 0%, #09B14B 100%)" }}
            >
              {/* Background decoration */}
              <div className="pointer-events-none absolute -end-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute -bottom-8 -start-8 h-32 w-32 rounded-full bg-white/5" />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
                  <FileText className="h-7 w-7" />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-white md:text-3xl">{t.card1Title}</h2>
                <p className="mt-2 text-base text-white/70">{t.card1Sub}</p>
              </div>

              <div className="relative mt-8 flex items-center justify-between">
                <span className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-brand-dark transition group-hover:bg-brand-light">
                  {t.card1Cta}
                  <ArrowIcon className="h-4 w-4" />
                </span>
              </div>
            </Link>

            {/* Card 2 — Nationwide Delivery */}
            <Link
              href={isRtl ? "/ar/get-quote" : "/get-quote"}
              className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-3xl border border-brand-dark/10 bg-brand-light p-8 md:min-h-[340px] md:p-10"
            >
              {/* Background decoration */}
              <div className="pointer-events-none absolute -end-12 -top-12 h-48 w-48 rounded-full bg-brand-dark/3" />
              <div className="pointer-events-none absolute -bottom-8 -start-8 h-32 w-32 rounded-full bg-brand-primary/5" />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark/10 text-brand-dark">
                  <Truck className="h-7 w-7" />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-brand-dark md:text-3xl">{t.card2Title}</h2>
                <p className="mt-2 text-base text-brand-dark/60">{t.card2Sub}</p>
              </div>

              <div className="relative mt-8 flex items-center justify-between">
                <span className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-dark px-6 text-sm font-bold text-white transition group-hover:bg-brand-primary">
                  {t.card2Cta}
                  <ArrowIcon className="h-4 w-4" />
                </span>
              </div>
            </Link>

          </div>
        </Container>
      </section>

      {/* ── Catalog ──────────────────────────────────── */}
      <section className="bg-[#f7f9f6] py-16 md:py-20">
        <Container>
          <div className="text-center">
            <h2 className="type-section-title mx-auto text-brand-dark">{t.catalogTitle}</h2>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {catalog.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.en}
                  className="group rounded-2xl border border-brand-dark/8 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand-primary/20 hover:shadow-soft"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand-primary transition group-hover:bg-brand-primary/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-[15px] font-bold text-brand-dark">{isRtl ? item.ar : item.en}</p>
                  <p className="mt-1.5 text-[13px] leading-5 text-brand-dark/52">{isRtl ? item.descAr : item.descEn}</p>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="text-center">
            <h2 className="type-section-title mx-auto text-brand-dark">{t.howTitle}</h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.en}
                  className="relative rounded-2xl border border-brand-dark/8 bg-white p-7 shadow-soft"
                >
                  <span className="absolute top-6 end-7 text-5xl font-black leading-none text-brand-dark/[0.06]">
                    {step.step}
                  </span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-[17px] font-bold text-brand-dark">{isRtl ? step.ar : step.en}</h3>
                  <p className="mt-2 text-sm leading-6 text-brand-dark/58">{isRtl ? step.descAr : step.descEn}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── CTA banner ───────────────────────────────── */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="overflow-hidden rounded-3xl bg-cta-gradient px-8 py-14 text-center md:px-14 md:py-16">
            <h2 className="text-3xl font-bold text-white md:text-[38px] md:leading-tight">
              {t.ctaTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-white/72">
              {t.ctaBody}
            </p>
            <div className="mt-9 flex justify-center">
              <Link
                href={isRtl ? "/ar/get-quote" : "/get-quote"}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-8 text-[15px] font-bold text-brand-dark shadow-premium transition hover:bg-brand-light"
              >
                {t.primary}
                <ArrowIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

    </main>
  );
}

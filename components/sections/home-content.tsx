"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Cable,
  CheckCircle,
  ClipboardList,
  Droplets,
  Fan,
  HardHat,
  LampCeiling,
  Package,
  Paintbrush,
  ShieldCheck,
  Store,
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
      en: "We Coordinate Supply",
      ar: "نرتب التوريد",
      descEn: "We review your request and match it with the right approved suppliers.",
      descAr: "نراجع الطلب ونختار الموردين المناسبين المعتمدين لتنفيذه.",
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

  const trustBadges = [
    { en: "BOQ-based ordering", ar: "طلب قائم على جدول الكميات" },
    { en: "KSA-wide delivery", ar: "توصيل في أنحاء المملكة" },
  ];


  const t = {
    eyebrow: isRtl ? "بيلد لتوريد مواد البناء" : "Build Construction Supply",
    titleLine1: isRtl ? "مواد البناء لمشروعك" : "Construction materials",
    titleLine2: isRtl ? "من مورد واحد" : "from one supplier",
    body: isRtl
      ? "اطلب احتياج المشروع، أرفق جدول الكميات، وحدد موقع التسليم. نراجع الطلب ونرتب التوريد حسب الفئات المطلوبة."
      : "Submit your project requirements, attach the BOQ, and set the delivery location. We review the request and coordinate supply by category.",
    primary: isRtl ? "أطلب المنتجات" : "Order Products",
    secondary: isRtl ? "كُن موردًا" : "Become a Supplier",
    catalogTitle: isRtl ? "الفئات المتوفرة" : "Available Categories",
    catalogSub: isRtl
      ? "نوفر مواد البناء عبر ثماني فئات رئيسية لجميع احتياجات مشاريعك الإنشائية"
      : "We supply construction materials across eight major categories for all your project needs",
    howTitle: isRtl ? "كيف يعمل بيلد؟" : "How Build Works",
    howSub: isRtl
      ? "ثلاث خطوات بسيطة لتأمين مواد مشروعك من الموردين المعتمدين"
      : "Three simple steps to secure your project materials from approved suppliers",
    ctaTitle: isRtl ? "جاهز لتوريد مشروعك؟" : "Ready to supply your project?",
    ctaBody: isRtl
      ? "أرسل احتياجاتك اليوم وسنتولى ترتيب التوريد من الموردين المعتمدين."
      : "Submit your requirements today and we'll coordinate supply from approved vendors.",
    processLabel: isRtl ? "العملية" : "Process",
    catalogLabel: isRtl ? "الكتالوج" : "Catalog",
  };

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="bg-white">

        <Container className="py-16 md:py-20 lg:py-24">
          <div className="max-w-[540px]">
            {/* Eyebrow */}
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-brand-primary/8 px-4 py-1.5 text-sm font-semibold text-brand-primary">
              <span className="h-2 w-2 rounded-full bg-brand-primary" />
              {t.eyebrow}
            </span>

            {/* Heading */}
            <h1 className="type-hero mt-6 text-brand-dark">
              {t.titleLine1}
              <br />
              {t.titleLine2}
            </h1>

            {/* Body */}
            <p className="type-subheading mt-5 max-w-[480px] text-brand-dark/62">{t.body}</p>

            {/* CTAs */}
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={isRtl ? "/ar/get-quote" : "/get-quote"}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-brand-dark px-7 text-[15px] font-bold text-white shadow-soft transition hover:bg-brand-primary"
              >
                {t.primary}
                <ArrowIcon className="h-4 w-4" />
              </Link>
              <Link
                href={isRtl ? "/ar/register" : "/register"}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-brand-dark/12 bg-white px-7 text-[15px] font-bold text-brand-dark transition hover:border-brand-dark/22 hover:bg-brand-dark/[0.03]"
              >
                <Store className="h-4 w-4 opacity-70" />
                {t.secondary}
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {trustBadges.map((b) => (
                <span key={b.en} className="flex items-center gap-1.5 text-sm font-medium text-brand-dark/55">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-brand-primary" />
                  {isRtl ? b.ar : b.en}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>


      {/* ── How it works ─────────────────────────────── */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-primary">{t.processLabel}</p>
            <h2 className="type-section-title mx-auto mt-3 text-brand-dark">{t.howTitle}</h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-brand-dark/58">{t.howSub}</p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
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

      {/* ── Catalog ──────────────────────────────────── */}
      <section className="bg-[#f7f9f6] py-16 md:py-24">
        <Container>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-primary">{t.catalogLabel}</p>
            <h2 className="type-section-title mx-auto mt-3 text-brand-dark">{t.catalogTitle}</h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-brand-dark/58">{t.catalogSub}</p>
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

      {/* ── CTA banner ───────────────────────────────── */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="overflow-hidden rounded-3xl bg-cta-gradient px-8 py-14 text-center md:px-14 md:py-16">
            <h2 className="text-3xl font-bold text-white md:text-[38px] md:leading-tight">
              {t.ctaTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-white/72">
              {t.ctaBody}
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href={isRtl ? "/ar/get-quote" : "/get-quote"}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-8 text-[15px] font-bold text-brand-dark shadow-premium transition hover:bg-brand-light"
              >
                {t.primary}
                <ArrowIcon className="h-4 w-4" />
              </Link>
              <Link
                href={isRtl ? "/ar/register" : "/register"}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white/30 px-8 text-[15px] font-bold text-white transition hover:border-white/55 hover:bg-white/10"
              >
                {t.secondary}
              </Link>
            </div>
          </div>
        </Container>
      </section>

    </main>
  );
}

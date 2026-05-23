"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Cable,
  Droplets,
  Fan,
  FileText,
  HardHat,
  LampCeiling,
  Paintbrush,
  ShieldCheck,
  Store,
  Warehouse,
} from "lucide-react";

import { Container } from "@/components/ui/container";

type HomeContentProps = {
  isRtl?: boolean;
};

type CatalogItem = {
  en: string;
  ar: string;
  icon: typeof Box;
};

export function HomeContent({ isRtl = false }: HomeContentProps) {
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const catalog: CatalogItem[] = [
    { en: "Building Materials", ar: "مواد البناء", icon: Warehouse },
    { en: "Safety Tools", ar: "أدوات السلامة", icon: HardHat },
    { en: "Electrical & Lighting", ar: "الكهرباء والإنارة", icon: LampCeiling },
    { en: "Plumbing", ar: "السباكة", icon: Droplets },
    { en: "Sanitary Ware", ar: "الأدوات الصحية", icon: ShieldCheck },
    { en: "HVAC", ar: "التكييف والتهوية", icon: Fan },
    { en: "Paint & Decor", ar: "الدهانات والتشطيبات", icon: Paintbrush },
    { en: "Piping Systems", ar: "أنظمة الأنابيب", icon: Cable },
  ];

  const t = {
    eyebrow: isRtl ? "بيلد لتوريد مواد البناء" : "Build Construction Supply",
    title: isRtl ? "مواد البناء لمشروعك من مورد واحد" : "Construction materials for your project, from one supplier",
    body: isRtl
      ? "اطلب احتياج المشروع، أرفق جدول الكميات، وحدد موقع التسليم. نراجع الطلب ونرتب التوريد حسب الفئات المطلوبة."
      : "Submit your project requirements, attach the BOQ, and set the delivery location. We review the request and coordinate supply by category.",
    primary: isRtl ? "أطلب المنتجات" : "Order Products",
    secondary: isRtl ? "كُن موردًا" : "Become a Supplier",
    catalogTitle: isRtl ? "الفئات المتوفرة" : "Available Categories",
    catalogBody: isRtl
      ? "ابدأ من الفئة المناسبة، ثم أرسل تفاصيل المشروع والكميات المطلوبة."
      : "Start with the right category, then send the project details and quantities.",
  };

  const metrics = [
    {
      value: isRtl ? "BOQ" : "BOQ",
      label: isRtl ? "رفع جدول الكميات" : "Quantity schedule",
    },
    {
      value: isRtl ? "RFQ" : "RFQ",
      label: isRtl ? "مراجعة طلب التوريد" : "Supply review",
    },
    {
      value: isRtl ? "KSA" : "KSA",
      label: isRtl ? "توصيل للموقع" : "Site delivery",
    },
  ];

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>
      <section className="relative min-h-[620px] overflow-hidden border-b border-brand-dark/10 bg-white">
        <div
          className="absolute inset-y-0 hidden w-[56%] bg-contain bg-center bg-no-repeat opacity-95 lg:block"
          style={{
            backgroundImage: "url('/images/build-truck.png')",
            [isRtl ? "left" : "right"]: 0,
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.90),rgba(248,250,247,0.96))] lg:bg-[linear-gradient(90deg,rgba(255,255,255,1)_0%,rgba(255,255,255,0.97)_42%,rgba(255,255,255,0.68)_100%)]" />
        <Container className="relative py-12 md:py-16 lg:py-20">
          <div className="max-w-[690px]">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-dark/10 bg-white px-3 py-1.5 text-sm font-semibold text-brand-primary shadow-soft">
                {t.eyebrow}
            </p>

            <h1 className="type-hero mt-6 text-brand-dark">{t.title}</h1>
            <p className="type-subheading mt-4 text-brand-dark/68">{t.body}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={isRtl ? "/ar/get-quote" : "/get-quote"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-dark px-7 text-base font-bold text-white transition hover:bg-brand-primary"
              >
                {t.primary}
                <ArrowIcon className="h-4 w-4" />
              </Link>
              <Link
                href={isRtl ? "/ar/register" : "/register"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-brand-dark/15 bg-white px-7 text-base font-bold text-brand-dark transition hover:border-brand-dark/30"
              >
                {t.secondary}
              </Link>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-brand-dark/10 bg-white/90 px-4 py-4 shadow-soft backdrop-blur">
                  <p className="text-lg font-black tracking-tight text-brand-dark">{metric.value}</p>
                  <p className="mt-1 text-sm text-brand-dark/58">{metric.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-2">
              <Link
                href={isRtl ? "/ar/get-quote" : "/get-quote"}
                className="rounded-2xl border border-brand-dark/10 bg-white/92 p-4 shadow-soft backdrop-blur transition hover:border-brand-primary/30"
              >
                <FileText className="h-5 w-5 text-brand-primary" />
                <p className="mt-3 text-sm font-bold text-brand-dark">{isRtl ? "أطلب المنتجات" : "Order Products"}</p>
                <p className="mt-1 text-sm leading-6 text-brand-dark/55">
                  {isRtl ? "أرسل احتياج مشروعك وجدول الكميات" : "Send your project requirements and BOQ"}
                </p>
              </Link>

              <Link
                href={isRtl ? "/ar/register" : "/register"}
                className="rounded-2xl border border-brand-dark/10 bg-white/92 p-4 shadow-soft backdrop-blur transition hover:border-brand-primary/30"
              >
                <Store className="h-5 w-5 text-brand-primary" />
                <p className="mt-3 text-sm font-bold text-brand-dark">{isRtl ? "كُن موردًا" : "Become a Supplier"}</p>
                <p className="mt-1 text-sm leading-6 text-brand-dark/55">
                  {isRtl ? "سجّل منشأتك ضمن قائمة الموردين" : "Register your company as a supplier"}
                </p>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-10 md:py-14">
        <Container>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-primary">{isRtl ? "الكتالوج" : "Catalog"}</p>
              <h2 className="mt-2 text-2xl font-bold text-brand-dark">{t.catalogTitle}</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-brand-dark/58">{t.catalogBody}</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {catalog.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.en}
                  className="rounded-2xl border border-brand-dark/10 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-brand-primary/25 hover:shadow-soft"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-brand-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm font-bold leading-6 text-brand-dark">{isRtl ? item.ar : item.en}</p>
                </article>
              );
            })}
          </div>
        </Container>
      </section>
    </main>
  );
}

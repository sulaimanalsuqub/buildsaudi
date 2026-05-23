"use client";

import Image from "next/image";
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
    eyebrow: isRtl ? "توريد مواد البناء" : "Construction Material Supply",
    title: isRtl ? "واجهة واضحة لطلب المنتجات وتسجيل الموردين" : "A focused home for product requests and supplier registration",
    body: isRtl
      ? "واجهة مختصرة ومباشرة للمشاريع والموردين، مع الكتالوج في المقدمة وصفحات الشروط والخصوصية جاهزة."
      : "A concise entry point for projects and suppliers, with the catalog up front and policy pages in place.",
    primary: isRtl ? "أطلب المنتجات" : "Order Products",
    secondary: isRtl ? "كُن موردًا" : "Become a Supplier",
    catalogTitle: isRtl ? "الفئات المتوفرة" : "Available Categories",
    catalogBody: isRtl
      ? "فئات مختارة بصياغة أبسط، لتصل مباشرة إلى الصفحة المناسبة."
      : "Selected categories with a cleaner presentation so users can move directly to the right page.",
  };

  const metrics = [
    {
      value: isRtl ? "3" : "3",
      label: isRtl ? "صفحات رئيسية" : "Core pages",
    },
    {
      value: isRtl ? "PDPL" : "PDPL",
      label: isRtl ? "سياسات واضحة" : "Policy pages",
    },
    {
      value: isRtl ? "KSA" : "KSA",
      label: isRtl ? "تغطية المملكة" : "Saudi coverage",
    },
  ];

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>
      <section className="border-b border-brand-dark/10 bg-gradient-to-b from-white to-brand-light/40">
        <Container className="py-12 md:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-center">
            <div>
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

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-brand-dark/10 bg-white px-4 py-4 shadow-soft">
                    <p className="text-lg font-black tracking-tight text-brand-dark">{metric.value}</p>
                    <p className="mt-1 text-sm text-brand-dark/58">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-brand-dark/10 bg-white p-5 shadow-soft md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-brand-dark">{isRtl ? "تجربة مختصرة" : "Focused experience"}</p>
                  <p className="mt-1 text-sm leading-6 text-brand-dark/55">
                    {isRtl
                      ? "صفحة رئيسية، طلب منتجات، تسجيل مورد، وسياسات."
                      : "Home, product requests, supplier registration, and policies."}
                  </p>
                </div>
                <span className="rounded-full border border-brand-dark/10 bg-brand-light px-3 py-1 text-xs font-semibold text-brand-dark/65">
                  {isRtl ? "جاهز" : "Ready"}
                </span>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-brand-dark/10 bg-brand-light/45">
                <Image
                  src="/images/build-truck.png"
                  alt={isRtl ? "واجهة بيلد" : "Build interface preview"}
                  width={1200}
                  height={1600}
                  className="h-auto w-full object-contain"
                  priority
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link
                  href={isRtl ? "/ar/get-quote" : "/get-quote"}
                  className="rounded-2xl border border-brand-dark/10 bg-white p-4 transition hover:border-brand-primary/30 hover:shadow-soft"
                >
                  <FileText className="h-5 w-5 text-brand-primary" />
                  <p className="mt-3 text-sm font-bold text-brand-dark">{isRtl ? "أطلب المنتجات" : "Order Products"}</p>
                  <p className="mt-1 text-sm leading-6 text-brand-dark/55">
                    {isRtl ? "أرسل طلبك مباشرة" : "Send a request directly"}
                  </p>
                </Link>

                <Link
                  href={isRtl ? "/ar/register" : "/register"}
                  className="rounded-2xl border border-brand-dark/10 bg-white p-4 transition hover:border-brand-primary/30 hover:shadow-soft"
                >
                  <Store className="h-5 w-5 text-brand-primary" />
                  <p className="mt-3 text-sm font-bold text-brand-dark">{isRtl ? "كُن موردًا" : "Become a Supplier"}</p>
                  <p className="mt-1 text-sm leading-6 text-brand-dark/55">
                    {isRtl ? "سجّل منشأتك" : "Register your company"}
                  </p>
                </Link>
              </div>
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

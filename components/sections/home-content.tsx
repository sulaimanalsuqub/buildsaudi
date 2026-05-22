"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, FileText, Store, ShieldCheck } from "lucide-react";

import { Container } from "@/components/ui/container";

type HomeContentProps = {
  isRtl?: boolean;
};

export function HomeContent({ isRtl = false }: HomeContentProps) {
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const catalog = [
    { en: "Building Materials", ar: "مواد بناء وإنشاء", icon: Building2 },
    { en: "Safety Tools", ar: "أدوات السلامة", icon: ShieldCheck },
    { en: "Electrical & Lighting", ar: "كهرباء وإنارة", icon: FileText },
    { en: "Plumbing", ar: "سباكة", icon: Store },
    { en: "Sanitary Ware", ar: "أدوات صحية", icon: Building2 },
    { en: "HVAC", ar: "تكييف وتبريد", icon: ShieldCheck },
    { en: "Paint & Decor", ar: "دهانات وديكور", icon: FileText },
    { en: "Piping Systems", ar: "أنظمة الأنابيب", icon: Store },
  ];
  const t = {
    eyebrow: isRtl ? "توريد مواد البناء" : "Construction Material Supply",
    title: isRtl ? "اطلب مواد مشروعك بسهولة" : "Order materials for your project with less friction",
    body: isRtl
      ? "استعرض الفئات وابدأ الطلب مباشرة، أو سجّل منشأتك إذا كنت موردًا."
      : "Browse categories and start a request right away, or register your company if you are a supplier.",
    primary: isRtl ? "أطلب المنتجات" : "Order Products",
    secondary: isRtl ? "سجّل كمورد" : "Register as Supplier",
    privacy: isRtl ? "سياسة الخصوصية" : "Privacy Policy",
    terms: isRtl ? "الشروط والأحكام" : "Terms & Conditions",
  };

  const navCards = [
    { href: isRtl ? "/ar/register" : "/register", label: isRtl ? "كُن موردًا" : "Become a Supplier", icon: Store },
    { href: isRtl ? "/ar/get-quote" : "/get-quote", label: isRtl ? "أطلب المنتجات" : "Order Products", icon: FileText },
    { href: isRtl ? "/ar/privacy-policy" : "/privacy-policy", label: t.privacy, icon: ShieldCheck },
    { href: isRtl ? "/ar/terms-conditions" : "/terms-conditions", label: t.terms, icon: Building2 },
  ];

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>
      <section className="py-8 md:py-12">
        <Container>
          <div className="grid gap-6 overflow-hidden rounded-3xl border border-brand-dark/10 bg-white shadow-soft lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.85fr)]">
            <div className="flex flex-col justify-center p-6 md:p-10">
              <p className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-primary/15 bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-primary">
                {t.eyebrow}
              </p>
              <h1 className="type-hero mt-5 text-brand-dark">{t.title}</h1>
              <p className="type-subheading mt-4 text-brand-dark/68">{t.body}</p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={isRtl ? "/ar/register" : "/register"}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-dark px-7 text-base font-bold text-white transition hover:bg-brand-primary"
                >
                  {t.primary}
                  <ArrowIcon className="h-4 w-4" />
                </Link>
                <Link
                  href={isRtl ? "/ar/get-quote" : "/get-quote"}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-brand-dark/15 bg-white px-7 text-base font-bold text-brand-dark transition hover:border-brand-dark/30"
                >
                  {t.secondary}
                </Link>
              </div>
            </div>

            <div className="border-t border-brand-dark/10 bg-brand-light/45 p-6 md:p-8 lg:border-t-0 lg:border-s">
              <div className="grid gap-3">
                <div className="rounded-2xl border border-brand-dark/10 bg-white p-4">
                  <Image
                    src="/images/build-truck.png"
                    alt={isRtl ? "منتجات بيلد" : "Build materials"}
                    width={1100}
                    height={722}
                    className="h-auto w-full rounded-xl object-cover"
                    priority
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {navCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <Link
                        key={card.href}
                        href={card.href}
                        className="rounded-2xl border border-brand-dark/10 bg-white p-4 transition hover:border-brand-primary/30 hover:shadow-soft"
                      >
                        <Icon className="h-5 w-5 text-brand-primary" />
                        <p className="mt-4 text-sm font-bold text-brand-dark">{card.label}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-2 pb-10 md:py-4 md:pb-16">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand-primary">{isRtl ? "الكتالوج" : "Catalog"}</p>
              <h2 className="mt-2 text-2xl font-bold text-brand-dark">{isRtl ? "الفئات المتوفرة" : "Available Categories"}</h2>
            </div>
            <p className="hidden max-w-md text-sm leading-6 text-brand-dark/58 md:block">
              {isRtl
                ? "استعرض الفئات المتوفرة ثم انتقل مباشرة إلى طلب المنتجات أو تسجيل المورد."
                : "Browse the available categories, then move directly to product requests or supplier registration."}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {catalog.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.en}
                  className="rounded-2xl border border-brand-dark/10 bg-white p-4 transition hover:border-brand-primary/30 hover:shadow-soft"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-brand-primary">
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

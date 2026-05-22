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
  const t = {
    eyebrow: isRtl ? "بيلد مورد مواد البناء" : "Build Construction Supplier",
    title: isRtl ? "صفحة بسيطة ومباشرة للموردين والطلبات" : "A simple entry point for suppliers and product requests",
    body: isRtl
      ? "الموقع الآن يركز على 3 صفحات أساسية فقط: الصفحة الرئيسية، أطلب المنتجات، كُن موردًا، مع السياسات المطلوبة."
      : "The site now focuses on three core pages: Home, Order Products, Become a Supplier, plus the required policies.",
    primary: isRtl ? "سجّل كمورد" : "Register as Supplier",
    secondary: isRtl ? "أطلب المنتجات" : "Order Products",
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
    </main>
  );
}

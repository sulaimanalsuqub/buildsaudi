"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bath,
  Box,
  Droplet,
  Droplets,
  Fan,
  LampCeiling,
  Layers,
  LayoutGrid,
  Paintbrush,
} from "lucide-react";

import { Grid } from "@/components/ui/grid";
import { HowItWorks } from "@/components/sections/how-it-works";
import { ensureScrollTrigger, usePrefersReducedMotion } from "@/lib/motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

ensureScrollTrigger();

type HomeContentProps = {
  isRtl?: boolean;
};

type CatalogItem = {
  en: string;
  ar: string;
  descEn: string;
  descAr: string;
  icon: typeof Box;
  bg: string;
  pattern?: string;
  patternSize?: string;
  dark: boolean;
};

export function HomeContent({ isRtl = false }: HomeContentProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [heroRevealed, setHeroRevealed] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState(0);

  const catalogSectionRef = useRef<HTMLElement>(null);
  const catalogTitleRef = useRef<HTMLHeadingElement>(null);

  const catalog: CatalogItem[] = [
    {
      en: "Sanitaryware & Bath Fittings", ar: "الأدوات الصحية",
      descEn: "Fixtures, faucets & bathroom sets", descAr: "تركيبات ومجموعات الحمام",
      icon: Bath, bg: "#F4F3EB", dark: false,
    },
    {
      en: "Electrical & Lighting", ar: "الكهرباء والإنارة",
      descEn: "Wiring, fixtures & LED systems", descAr: "أسلاك وتركيبات وأنظمة LED",
      icon: LampCeiling, bg: "#0F1F13", dark: true,
      pattern: "repeating-linear-gradient(135deg, rgba(197,217,45,.2) 0 2px, transparent 2px 14px)",
    },
    {
      en: "Plumbing & Piping Systems", ar: "السباكة وأنظمة الأنابيب",
      descEn: "Pipes, fittings & valves", descAr: "أنابيب وتركيبات وصمامات",
      icon: Droplets, bg: "#1D3F1F", dark: true,
      pattern: "radial-gradient(circle at 50% 50%, transparent 0 14px, rgba(255,255,255,.14) 14px 16px, transparent 16px)",
      patternSize: "40px 40px",
    },
    {
      en: "HVAC", ar: "التكييف والتهوية",
      descEn: "AC units, ventilation & ducting", descAr: "وحدات تكييف وتهوية وقنوات",
      icon: Fan, bg: "#DCE3DC", dark: false,
      pattern: "radial-gradient(rgba(29,63,31,.28) 1.5px, transparent 1.5px)",
      patternSize: "16px 16px",
    },
    {
      en: "Tiles & Flooring", ar: "الأرضيات",
      descEn: "Ceramic, porcelain & stone flooring", descAr: "سيراميك وبورسلين وأرضيات حجرية",
      icon: LayoutGrid, bg: "#DCD6C4", dark: false,
      pattern: "linear-gradient(rgba(29,63,31,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(29,63,31,.14) 1px, transparent 1px)",
      patternSize: "26px 26px",
    },
    {
      en: "Wall Finishes & Coverings", ar: "الجداريات",
      descEn: "Cladding, panels & wall coverings", descAr: "تكسيات وألواح وتغطيات جدارية",
      icon: Layers, bg: "#F4F3EB", dark: false,
      pattern: "repeating-linear-gradient(-45deg, rgba(29,63,31,.09) 0 8px, transparent 8px 16px)",
    },
    {
      en: "Paints & Coatings", ar: "الدهانات الداخلية والخارجية",
      descEn: "Interior, exterior & specialty paints", descAr: "دهانات داخلية وخارجية ومتخصصة",
      icon: Paintbrush, bg: "#05B04C", dark: true,
    },
    {
      en: "Adhesives, Grouts & Sealants", ar: "اللواصق والمواد المساعدة",
      descEn: "Adhesives, grouts & sealing solutions", descAr: "لواصق ومواد حشو وعزل",
      icon: Droplet, bg: "#EDEAE0", dark: false,
      pattern: "repeating-linear-gradient(45deg, rgba(29,63,31,.12) 0 1px, transparent 1px 10px), repeating-linear-gradient(-45deg, rgba(29,63,31,.12) 0 1px, transparent 1px 10px)",
    },
  ];

  const active = catalog[activeMaterial];

  const t = {
    body: isRtl
      ? "توريد مواد البناء والتشطيب للمقاولين والمطورين"
      : "Supply of building materials and finishes for contractors and developers",
    trust: [
      isRtl ? "عرض سعر واضح" : "Clear quotations",
      isRtl ? "توريد للموقع" : "Site delivery",
      isRtl ? "متابعة من البداية" : "End-to-end support",
    ],
    catalogTitle: isRtl ? "المواد اللي نورّدها" : "The materials we move",
    catalogSub: isRtl ? "جميع احتياجات مشروعك" : "Everything your project needs",
    ctaLead: isRtl ? "أرسل طلبك، " : "Send your request. ",
    ctaAction: isRtl ? "وسنرتب التوريد لك." : "We'll coordinate the supply.",
    primary: isRtl ? "أطلب المنتجات" : "Order Products",
  };

  const quoteHref = isRtl ? "/ar/get-quote" : "/get-quote";

  useEffect(() => {
    if (reducedMotion) {
      setHeroRevealed(true);
      return;
    }
    const id = window.setTimeout(() => setHeroRevealed(true), 120);
    return () => window.clearTimeout(id);
  }, [reducedMotion]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        catalogTitleRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: catalogTitleRef.current, start: "top 85%", toggleActions: "play none none reverse" },
        }
      );
    }, catalogSectionRef);

    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => ctx.revert();
  }, [isRtl]);

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>

      {/* ── Hero — "The Manifest" ───────────────────── */}
      <section className="relative -mt-[72px] flex min-h-[clamp(560px,88svh,860px)] items-end overflow-hidden bg-white pb-[var(--space-compact)] pt-[calc(72px+var(--space-compact))]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#1D3F1F 1px, transparent 1px), linear-gradient(90deg, #1D3F1F 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
          aria-hidden="true"
        />

        <Grid className="relative w-full">
          <div className="col-span-4 sm:col-span-8 lg:col-span-8">
            <div className="relative overflow-hidden">
              <h1 className="type-display text-brand-dark">
                {isRtl ? (
                  <>
                    رحلة توريد المواد <span className="text-brand-primary">أسرع</span>
                  </>
                ) : (
                  <>
                    Materials Supply, <span className="text-brand-primary">Faster</span>
                  </>
                )}
              </h1>
              <span
                aria-hidden="true"
                className={`absolute inset-0 bg-white transition-transform duration-[900ms] ease-[cubic-bezier(.65,0,.35,1)] ${heroRevealed ? "scale-x-0" : "scale-x-100"}`}
                style={{ transformOrigin: isRtl ? "left" : "right" }}
              />
            </div>
          </div>

          <div className="col-span-4 sm:col-span-8 lg:col-span-4 lg:col-start-9 mt-10 flex flex-col justify-end lg:mt-0">
            <Link
              href={quoteHref}
              className="inline-flex h-14 w-fit items-center justify-center rounded-md bg-brand-dark px-9 text-base font-bold text-white transition hover:bg-brand-primary"
            >
              {t.primary}
            </Link>
          </div>

          <div className="col-span-4 sm:col-span-8 lg:col-span-12 mt-16 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-brand-dark/10 pt-5 md:mt-24">
            <span className="type-body text-brand-dark/60">{t.body}</span>
            <div className="flex flex-wrap gap-2">
              {t.trust.map((item, i) => (
                <span
                  key={item}
                  className={`type-micro rounded-md px-3 py-1.5 ${
                    i === 0 ? "bg-brand-dark text-white" : i === 1 ? "bg-brand-primary text-white" : "bg-brand-accent text-brand-dark"
                  }`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Grid>
      </section>

      {/* ── Materials index ─────────────────────────── */}
      <section id="catalog" ref={catalogSectionRef} className="bg-white py-[var(--space-section)] scroll-mt-20">
        <Grid>
          <div className="col-span-4 sm:col-span-8 lg:col-span-12 mb-12 md:mb-16">
            <h2 ref={catalogTitleRef} className="type-editorial text-brand-dark" style={{ opacity: 0 }}>
              {t.catalogTitle}
            </h2>
            <p className="type-body mt-3 text-brand-dark/55">{t.catalogSub}</p>
          </div>

          {/* Desktop: sticky index + active detail panel */}
          <div className="col-span-4 hidden lg:col-span-4 lg:block">
            <ul className="sticky top-[96px] border-t border-brand-dark/10">
              {catalog.map((item, i) => (
                <li key={item.en} className="border-b border-brand-dark/10">
                  <button
                    type="button"
                    onMouseEnter={() => setActiveMaterial(i)}
                    onFocus={() => setActiveMaterial(i)}
                    className={`flex w-full items-baseline justify-between gap-4 py-4 text-start transition-colors ${
                      activeMaterial === i ? "text-brand-primary" : "text-brand-dark/45 hover:text-brand-dark"
                    }`}
                  >
                    <span className="type-section-title">{isRtl ? item.ar : item.en}</span>
                    <span className="type-micro shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-8 hidden lg:block">
            <div
              className="relative h-[440px] overflow-hidden transition-[background-color] duration-500"
              style={{
                backgroundColor: active.bg,
                backgroundImage: active.pattern,
                backgroundSize: active.patternSize,
              }}
            >
              <active.icon
                className={`absolute top-8 h-8 w-8 ${isRtl ? "right-8" : "left-8"} ${active.dark ? "text-white/80" : "text-brand-dark/60"}`}
                aria-hidden="true"
              />
              <p className={`absolute bottom-8 max-w-md ${isRtl ? "right-8 text-end" : "left-8"} type-statement ${active.dark ? "text-white" : "text-brand-dark"}`}>
                {isRtl ? active.descAr : active.descEn}
              </p>
            </div>
          </div>

          {/* Mobile / tablet: horizontal scroll-snap strip */}
          <div className="col-span-4 sm:col-span-8 lg:hidden">
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
              {catalog.map((item) => (
                <div
                  key={item.en}
                  className="relative h-[320px] w-[78%] shrink-0 snap-start overflow-hidden"
                  style={{ backgroundColor: item.bg, backgroundImage: item.pattern, backgroundSize: item.patternSize }}
                >
                  <item.icon className={`absolute top-6 h-6 w-6 ${isRtl ? "right-6" : "left-6"} ${item.dark ? "text-white/80" : "text-brand-dark/60"}`} aria-hidden="true" />
                  <div className={`absolute bottom-6 ${isRtl ? "right-6 text-end" : "left-6"}`}>
                    <h3 className={`text-lg font-bold ${item.dark ? "text-white" : "text-brand-dark"}`}>{isRtl ? item.ar : item.en}</h3>
                    <p className={`mt-1 max-w-[85%] text-sm ${item.dark ? "text-white/75" : "text-brand-dark/55"}`}>{isRtl ? item.descAr : item.descEn}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Grid>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <HowItWorks isRtl={isRtl} />

      {/* ── Final CTA — typographic statement ─────────── */}
      <section className="bg-brand-dark py-[var(--space-section)]">
        <Grid>
          <div className="col-span-4 sm:col-span-8 lg:col-span-10 lg:col-start-2">
            <p className="type-statement text-white">
              {t.ctaLead}
              <Link
                href={quoteHref}
                className="underline decoration-brand-accent decoration-4 underline-offset-8 transition hover:text-brand-accent"
              >
                {t.ctaAction}
              </Link>
            </p>
            <div className="mt-10">
              <Link
                href={quoteHref}
                className="inline-flex h-14 items-center justify-center rounded-md bg-white px-9 text-base font-bold text-brand-dark transition hover:bg-brand-accent"
              >
                {t.primary}
              </Link>
            </div>
          </div>
        </Grid>
      </section>

    </main>
  );
}

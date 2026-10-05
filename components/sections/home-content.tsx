"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
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
import { usePrefersReducedMotion } from "@/lib/motion";


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
  const DirectionArrow = isRtl ? ArrowLeft : ArrowRight;

  const t = {
    body: isRtl
      ? "توريد مواد البناء والتشطيب للمقاولين والمطورين"
      : "Supply of building materials and finishes for contractors and developers",
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


  return (
    <main dir={isRtl ? "rtl" : "ltr"}>

      <section className="home-hero relative overflow-hidden bg-white pb-8 pt-12 md:pt-20">
        <Grid className="items-center gap-y-10">
          <div className="col-span-4 sm:col-span-8 lg:col-span-7">
            <h1 className="home-title text-brand-dark">
              {isRtl ? <>رحلة توريد المواد<br /><span className="text-brand-primary">أسرع</span></> : <>Materials supply,<br /><span className="text-brand-primary">Faster</span></>}
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-brand-dark/75 md:text-xl">{t.body}</p>
            <div className="mt-8 flex flex-wrap items-center gap-6 md:mt-10">
              <a
                href={`https://wa.me/966553771777?text=${encodeURIComponent(isRtl ? "هلا بيلد، يرجى تزويدي بعرض سعر للأصناف" : "Hi Build, please send me a quote for the following items.")}`}
                target="_blank" rel="noopener noreferrer"
                className="group inline-flex min-h-14 items-center justify-center gap-6 rounded-md bg-brand-dark px-7 text-base font-bold text-white transition-colors hover:bg-brand-dark/90"
              >
                {t.primary}<DirectionArrow className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none" aria-hidden="true" />
              </a>
              <a href="#catalog" className="inline-flex min-h-12 items-center gap-3 border-b border-brand-dark/30 text-sm font-bold hover:border-brand-primary">
                {isRtl ? "استكشف المواد" : "Explore materials"}<ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className={`hero-supply col-span-4 sm:col-span-8 lg:col-span-5 ${heroRevealed ? "is-revealed" : ""}`}>
            <div className="flex items-center justify-between gap-4 border-b border-brand-dark/15 pb-5 text-sm font-semibold">
              <span>{isRtl ? "من احتياجك، إلى أرض مشروعك" : "From your requirements to your site"}</span>
              <Box className="h-5 w-5 shrink-0" aria-hidden="true" />
            </div>
            <div className="relative my-7 aspect-[2/1] w-full">
              <Image src="/images/build-truck-vendor.png" alt={isRtl ? "شاحنة توريد بيلد" : "Build supply truck"} fill priority sizes="(min-width: 1024px) 42vw, 90vw" className="object-contain" />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-brand-dark/15 pt-5 text-xs font-semibold sm:text-sm">
              <span>{isRtl ? "الطلب" : "Request"}</span><DirectionArrow className="h-4 w-4 text-brand-primary" aria-hidden="true" />
              <span>{isRtl ? "عرض السعر" : "Quote"}</span><DirectionArrow className="h-4 w-4 text-brand-primary" aria-hidden="true" />
              <span>{isRtl ? "التسليم" : "Delivery"}</span>
            </div>
          </div>

        </Grid>
      </section>

      {/* ── Materials index ─────────────────────────── */}
      <section id="catalog" className="bg-white pb-[var(--space-section)] pt-16 md:pt-24 scroll-mt-20">
        <Grid>
          <div className="col-span-4 sm:col-span-8 lg:col-span-12 mb-12 md:mb-16">
            <h2 className="type-editorial text-brand-dark">
              {t.catalogTitle}
            </h2>
            <p className="type-body mt-3 text-brand-dark/70">{t.catalogSub}</p>
          </div>

          {/* Desktop: sticky index + active detail panel */}
          <div className="col-span-4 hidden lg:col-span-4 lg:block">
            <ul className="sticky top-[96px] border-t border-brand-dark/10">
              {catalog.map((item, i) => (
                <li key={item.en} className="border-b border-brand-dark/10">
                  <button
                    type="button"
                    onClick={() => setActiveMaterial(i)}
                    aria-pressed={activeMaterial === i}
                    aria-controls="material-detail"
                    onMouseEnter={() => setActiveMaterial(i)}
                    onFocus={() => setActiveMaterial(i)}
                    className={`flex w-full items-center justify-between gap-4 py-4 text-start transition-colors ${
                      activeMaterial === i ? "text-brand-dark" : "text-brand-dark/65 hover:text-brand-dark"
                    }`}
                  >
                    <span className="text-xl font-bold xl:text-2xl">{isRtl ? item.ar : item.en}</span>
                    <DirectionArrow aria-hidden="true" className={`h-5 w-5 shrink-0 transition-opacity ${activeMaterial === i ? "text-brand-primary opacity-100" : "opacity-25"}`} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-8 hidden lg:block">
            <div
              id="material-detail" role="region" aria-label={isRtl ? active.ar : active.en}
              className="relative flex min-h-[490px] flex-col justify-between overflow-hidden p-8 transition-[background-color] duration-500 motion-reduce:transition-none xl:p-10"
              style={{
                backgroundColor: active.bg,
                backgroundImage: active.pattern,
                backgroundSize: active.patternSize,
              }}
            >
              <div className={`flex items-center justify-between ${active.dark ? "text-white" : "text-brand-dark"}`}>
                <span className="text-sm font-semibold">{isRtl ? active.ar : active.en}</span>
                <active.icon className="h-8 w-8" aria-hidden="true" />
              </div>
              <active.icon className={`pointer-events-none absolute end-10 top-20 h-48 w-48 opacity-[0.08] ${active.dark ? "text-white" : "text-brand-dark"}`} strokeWidth={1} aria-hidden="true" />
              <div className="relative mt-24">
                <p className={`max-w-lg text-start text-3xl font-bold leading-snug xl:text-5xl ${active.dark ? "text-white" : "text-brand-dark"}`}>{isRtl ? active.descAr : active.descEn}</p>
                <Link href={quoteHref} className={`mt-8 inline-flex min-h-12 items-center gap-4 border-b text-sm font-bold ${active.dark ? "border-white/50 text-white" : "border-brand-dark/40 text-brand-dark"}`}>
                  {isRtl ? "اطلب عرض سعر" : "Request a quote"}<DirectionArrow className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile / tablet: horizontal scroll-snap strip */}
          <div className="col-span-4 sm:col-span-8 lg:hidden">
            <div className="material-strip -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
              {catalog.map((item) => (
                <div
                  key={item.en}
                  className="relative min-h-[320px] w-[78%] shrink-0 snap-start"
                  style={{ backgroundColor: item.bg, backgroundImage: item.pattern, backgroundSize: item.patternSize }}
                >
                  <item.icon className={`absolute top-6 h-6 w-6 ${isRtl ? "right-6" : "left-6"} ${item.dark ? "text-white/80" : "text-brand-dark/60"}`} aria-hidden="true" />
                  <div className={`absolute bottom-6 ${isRtl ? "right-6 left-6 text-start" : "left-6 right-6"}`}>
                    <h3 className={`text-lg font-bold ${item.dark ? "text-white" : "text-brand-dark"}`}>{isRtl ? item.ar : item.en}</h3>
                    <p className={`mt-1 max-w-[85%] text-sm ${item.dark ? "text-white/90" : "text-brand-dark/75"}`}>{isRtl ? item.descAr : item.descEn}</p>
                    <Link href={quoteHref} className={`mt-4 inline-flex min-h-11 items-center gap-3 border-b text-sm font-bold ${item.dark ? "border-white/50 text-white" : "border-brand-dark/40 text-brand-dark"}`}>{isRtl ? "اطلب عرض سعر" : "Request a quote"}<DirectionArrow className="h-4 w-4" aria-hidden="true" /></Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Grid>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <HowItWorks isRtl={isRtl} />

      <section className="supply-cta text-brand-dark" style={{ backgroundColor: "#dde6d7" }}>
        <Grid className="items-end gap-y-10">
          <div className="col-span-4 sm:col-span-8 lg:col-span-9">
            <h2 className="supply-cta-title">{isRtl ? <>أرسل طلبك.<br />وسنرتّب <span className="cta-outline">التوريد لك.</span></> : <>Send your request.<br />We&apos;ll handle <span className="cta-outline">the supply.</span></>}</h2>
          </div>
          <div className="col-span-4 sm:col-span-8 lg:col-span-3 lg:justify-self-end">
            <Link href={quoteHref} className="supply-cta-link group flex items-center gap-5 font-bold">
              <span>{isRtl ? "اطلب عرض سعر" : "Request a quote"}</span>
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-dark text-brand-accent transition-transform duration-300 group-hover:-rotate-45 motion-reduce:transform-none sm:h-24 sm:w-24"><DirectionArrow className="h-9 w-9" strokeWidth={1.5} aria-hidden="true" /></span>
            </Link>
          </div>
          <div className="col-span-4 mt-5 flex flex-wrap items-center justify-between gap-5 border-t border-brand-dark/25 pt-7 text-sm font-semibold sm:col-span-8 lg:col-span-12">
            <span>{t.body}</span>
            <Link href={isRtl ? "/ar/track-request" : "/track-request"} className="inline-flex min-h-11 items-center gap-3 hover:underline">{isRtl ? "عندك طلب سابق؟ تتبّع طلبك" : "Already sent a request? Track it here"}<DirectionArrow className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </Grid>
      </section>

    </main>
  );
}

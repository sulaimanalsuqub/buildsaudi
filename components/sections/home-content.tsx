"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
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

import { Container } from "@/components/ui/container";
import { HowItWorks } from "@/components/sections/how-it-works";

gsap.registerPlugin(ScrollTrigger);

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

export function HomeContent({ isRtl = false }: HomeContentProps) {
  const catalogSectionRef = useRef<HTMLElement>(null);
  const catalogTitleRef = useRef<HTMLHeadingElement>(null);
  const catalogSubRef = useRef<HTMLParagraphElement>(null);
  const catalogCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const catalogIconRefs = useRef<(HTMLDivElement | null)[]>([]);

  const catalog: CatalogItem[] = [
    { en: "Sanitaryware & Bath Fittings", ar: "الأدوات الصحية", descEn: "Fixtures, faucets & bathroom sets", descAr: "تركيبات ومجموعات الحمام", icon: Bath },
    { en: "Electrical & Lighting", ar: "الكهرباء والإنارة", descEn: "Wiring, fixtures & LED systems", descAr: "أسلاك وتركيبات وأنظمة LED", icon: LampCeiling },
    { en: "Plumbing & Piping Systems", ar: "السباكة وأنظمة الأنابيب", descEn: "Pipes, fittings & valves", descAr: "أنابيب وتركيبات وصمامات", icon: Droplets },
    { en: "HVAC", ar: "التكييف والتهوية", descEn: "AC units, ventilation & ducting", descAr: "وحدات تكييف وتهوية وقنوات", icon: Fan },
    { en: "Tiles & Flooring", ar: "الأرضيات", descEn: "Ceramic, porcelain & stone flooring", descAr: "سيراميك وبورسلين وأرضيات حجرية", icon: LayoutGrid },
    { en: "Wall Finishes & Coverings", ar: "الجداريات", descEn: "Cladding, panels & wall coverings", descAr: "تكسيات وألواح وتغطيات جدارية", icon: Layers },
    { en: "Paints & Coatings", ar: "الدهانات الداخلية والخارجية", descEn: "Interior, exterior & specialty paints", descAr: "دهانات داخلية وخارجية ومتخصصة", icon: Paintbrush },
    { en: "Adhesives, Grouts & Sealants", ar: "اللواصق والمواد المساعدة", descEn: "Adhesives, grouts & sealing solutions", descAr: "لواصق ومواد حشو وعزل", icon: Droplet },
  ];

  const t = {
    title: isRtl
      ? "مورد مواد بناء وتشطيب للمشاريع الإنشائية"
      : "Building Materials & Finishes Supplier for Construction Projects",
    body: isRtl
      ? "توريد مواد البناء والتشطيب للمقاولين والمطورين"
      : "Supply of building materials and finishes for contractors and developers",
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

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [catalogTitleRef.current, catalogSubRef.current],
        { y: 32, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.12,
          scrollTrigger: { trigger: catalogTitleRef.current, start: "top 82%", toggleActions: "play none none reverse" },
        }
      );

      const cards = catalogCardRefs.current.filter(Boolean);
      if (cards.length) {
        gsap.fromTo(
          cards,
          { y: 16, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.05,
            scrollTrigger: { trigger: cards[0], start: "top 92%", toggleActions: "play none none reverse" },
          }
        );
      }
    }, catalogSectionRef);

    // Arabic webfont loads after mount (font-display: swap) and shifts text
    // height, which can leave ScrollTrigger's start/end offsets stale.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => ctx.revert();
  }, [isRtl]);

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-dark">
        <Image
          src="/images/buildman.png"
          alt={isRtl ? "توريد مواد البناء" : "Construction supply"}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_58%]"
        />
        <div
          className={`absolute inset-0 ${isRtl ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-brand-dark/95 via-brand-dark/70 to-brand-dark/30`}
        />

        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex min-h-[560px] max-w-xl flex-col justify-center py-24 text-start md:min-h-[640px] md:py-32"
          >
            <h1 className="type-hero text-white">
              {isRtl ? (
                <>
                  مورد مواد بناء وتشطيب{" "}
                  <span className="text-brand-accent">للمشاريع الإنشائية</span>
                </>
              ) : (
                <>
                  Building Materials &amp; Finishes Supplier{" "}
                  <span className="text-brand-accent">for Construction Projects</span>
                </>
              )}
            </h1>
            <p className="type-subheading mt-6 max-w-xl text-white/75">
              {t.body}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href={isRtl ? "/ar/get-quote" : "/get-quote"}
                className="inline-flex h-12 items-center justify-center rounded-md bg-brand-primary px-9 text-base font-bold text-white transition hover:bg-white hover:text-brand-dark"
              >
                {t.primary}
              </Link>
              <a
                href="#catalog"
                className="inline-flex items-center gap-2 text-sm font-bold text-white/80 transition hover:text-brand-accent"
              >
                {isRtl ? "تصفح الفئات" : "Browse Categories"}
                {isRtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </a>
            </div>
          </motion.div>
        </Container>

        {/* Trust badge */}
        <div className="absolute bottom-8 end-8 hidden items-center gap-3 px-5 py-4 md:flex">
          <Image
            src="/images/build-icon.png"
            alt={isRtl ? "أيقونة بيلد" : "Build icon"}
            width={40}
            height={40}
            className="h-9 w-9 shrink-0"
          />
          <div>
            <p className="text-sm font-bold text-white">{isRtl ? "موثوقية كاملة" : "Full Reliability"}</p>
            <p className="text-xs text-white/65">{isRtl ? "توصيل آمن للمواقع" : "Secure Site Delivery"}</p>
          </div>
        </div>
      </section>

      {/* ── Catalog ──────────────────────────────────── */}
      <section id="catalog" ref={catalogSectionRef} className="bg-brand-light py-20 md:py-28 scroll-mt-20">
        <Container>
          <div className="flex flex-col items-start text-start">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-[2px] w-8 bg-brand-primary" />
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark/55">
                  {t.catalogLabel}
                </span>
              </div>
              <h2
                ref={catalogTitleRef}
                className="type-section-title text-brand-dark"
                style={{ opacity: 0 }}
              >
                {t.catalogTitle}
              </h2>
              <p
                ref={catalogSubRef}
                className="type-body mt-3 text-brand-dark/60"
                style={{ opacity: 0 }}
              >
                {t.catalogSub}
              </p>
            </div>
          </div>

          <div
            className={`mt-12 grid grid-cols-1 divide-y divide-brand-dark/10 border border-brand-dark/10 bg-white sm:grid-cols-2 sm:divide-x lg:grid-cols-4 ${isRtl ? "sm:divide-x-reverse" : ""}`}
          >
            {catalog.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.en}
                  ref={(el) => { catalogCardRefs.current[index] = el; }}
                  className="group relative flex flex-col p-7"
                >
                  <div
                    ref={(el) => { catalogIconRefs.current[index] = el; }}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-dark/15 text-brand-dark transition-colors group-hover:border-brand-primary group-hover:text-brand-primary"
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-brand-dark">{isRtl ? item.ar : item.en}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-dark/50">{isRtl ? item.descAr : item.descEn}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <HowItWorks isRtl={isRtl} />


    </main>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import Image from "next/image";
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
  const catalogStripeRefs = useRef<(HTMLDivElement | null)[]>([]);
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
    eyebrow: isRtl ? "بيلد — مورد مواد بناء وتشطيب" : "Build — Materials & Finishes Supplier",
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

      catalogCardRefs.current.forEach((card, i) => {
        if (!card) return;
        const st = { trigger: card, start: "top 88%", toggleActions: "play none none reverse" };
        const delay = (i % 4) * 0.06;

        gsap.fromTo(
          card,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power3.out", delay, scrollTrigger: st }
        );
        gsap.fromTo(
          catalogStripeRefs.current[i],
          { scaleX: 0 },
          {
            scaleX: 1, duration: 0.4, ease: "power2.inOut", delay: delay + 0.1,
            transformOrigin: isRtl ? "right center" : "left center",
            scrollTrigger: st,
          }
        );
        gsap.fromTo(
          catalogIconRefs.current[i],
          { scale: 0, backgroundColor: "rgba(5,176,76,0)" },
          { scale: 1, backgroundColor: "#05B04C", duration: 0.45, ease: "back.out(4)", delay: delay + 0.16, scrollTrigger: st }
        );
      });
    }, catalogSectionRef);

    return () => ctx.revert();
  }, [isRtl]);

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pb-20 pt-24 md:pb-32 md:pt-40">

        <Container className="relative">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">

            {/* Text Section (Right side in RTL) */}
            <div className="flex flex-col items-center md:items-start text-center md:text-start">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="type-hero text-brand-dark leading-[1.15]">
                  {isRtl ? (
                    <>
                      مورد مواد بناء وتشطيب{" "}
                      <span className="text-brand-primary">للمشاريع الإنشائية</span>
                    </>
                  ) : (
                    <>
                      Building Materials &amp; Finishes Supplier{" "}
                      <span className="text-brand-primary">for Construction Projects</span>
                    </>
                  )}
                </h1>
                <p className="type-subheading mt-6 max-w-xl text-brand-dark/70">
                  {t.body}
                </p>

                <div className="mt-10">
                  <Link
                    href={isRtl ? "/ar/get-quote" : "/get-quote"}
                    className="inline-flex h-14 items-center justify-center rounded-full bg-brand-primary px-10 text-lg font-bold text-white transition hover:bg-brand-dark"
                  >
                    {t.primary}
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Image Section (Left side in RTL) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="overflow-hidden rounded-2xl border border-brand-dark/10 bg-brand-light md:aspect-square md:rounded-[3rem]">
                <Image
                  src="/images/buildman.png"
                  alt={isRtl ? "توريد مواد البناء" : "Construction supply"}
                  width={800}
                  height={800}
                  className="w-full h-auto object-cover object-center md:h-full"
                  priority
                />
              </div>

              {/* Floating Stat Card — مخفي على الجوال لتفادي الـ overflow */}
              <div className="absolute -bottom-6 -inline-start-6 hidden rounded-2xl border border-brand-dark/10 bg-white p-6 md:flex">
                <div className="flex items-center gap-4">
                  <Image
                    src="/images/build-icon.png"
                    alt={isRtl ? "أيقونة بيلد" : "Build icon"}
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-bold text-brand-dark">{isRtl ? "موثوقية كاملة" : "Full Reliability"}</p>
                    <p className="text-xs text-brand-dark/60">{isRtl ? "توصيل آمن للمواقع" : "Secure Site Delivery"}</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </Container>
      </section>

      {/* ── Catalog ──────────────────────────────────── */}
      <section ref={catalogSectionRef} className="bg-brand-light py-20 md:py-32">
        <Container>
          <div className="flex flex-col items-center text-center">
            <div className="max-w-3xl">
              <h2
                ref={catalogTitleRef}
                className="text-3xl font-black tracking-tight text-brand-dark md:text-5xl"
                style={{ opacity: 0 }}
              >
                {t.catalogTitle}
              </h2>
              <p
                ref={catalogSubRef}
                className="mt-4 text-lg text-brand-dark/60"
                style={{ opacity: 0 }}
              >
                {t.catalogSub}
              </p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {catalog.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.en}
                  ref={(el) => { catalogCardRefs.current[index] = el; }}
                  className="group relative overflow-hidden rounded-2xl bg-white p-7 pt-8 transition-transform duration-300 ease-out hover:-translate-y-1"
                  style={{ clipPath: "inset(100% 0% 0% 0%)" }}
                >
                  {/* top accent stripe */}
                  <div
                    ref={(el) => { catalogStripeRefs.current[index] = el; }}
                    className="absolute inset-x-0 top-0 h-[3px] bg-brand-primary"
                    style={{ transform: "scaleX(0)", transformOrigin: isRtl ? "right center" : "left center" }}
                  />

                  {/* faint index number */}
                  <span className="absolute top-7 text-xs font-bold tabular-nums text-brand-dark/15 ltr:right-7 rtl:left-7">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div
                    ref={(el) => { catalogIconRefs.current[index] = el; }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ transform: "scale(0)", backgroundColor: "rgba(5,176,76,0)" }}
                  >
                    <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-brand-dark">{isRtl ? item.ar : item.en}</h3>
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

"use client";

import { useEffect, useRef } from "react";
import { ClipboardList, Package, Truck } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Grid } from "@/components/ui/grid";
import { ensureScrollTrigger, usePrefersReducedMotion } from "@/lib/motion";

ensureScrollTrigger();

type HowItWorksProps = {
  isRtl?: boolean;
};

type Step = {
  en: string;
  ar: string;
  descEn: string;
  descAr: string;
  icon: typeof ClipboardList;
};

const steps: Step[] = [
  {
    en: "Submit Requirements",
    ar: "أرسل احتياجاتك",
    descEn: "Upload your BOQ and project specifications through our simple form.",
    descAr: "ارفع جدول الكميات ومواصفات مشروعك عبر نموذجنا البسيط.",
    icon: ClipboardList,
  },
  {
    en: "We Prepare Your Quote",
    ar: "نجهّز عرض السعر",
    descEn: "We review your requirements and prepare a comprehensive price quote.",
    descAr: "نراجع احتياجاتك ونجهّز عرض سعر شاملاً لمشروعك في أسرع وقت.",
    icon: Package,
  },
  {
    en: "Delivered On-Site",
    ar: "التسليم في الموقع",
    descEn: "Materials are delivered directly to your project location across KSA.",
    descAr: "تُسلَّم المواد مباشرةً في موقع مشروعك في أنحاء المملكة.",
    icon: Truck,
  },
];

export function HowItWorks({ isRtl = false }: HowItWorksProps) {
  const reducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackWrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Renders as a static vertical sequence (works everywhere, no JS scroll-linking required)
  // whenever the user prefers reduced motion — the pinned horizontal track is skipped entirely.
  const showHorizontalTrack = !reducedMotion;

  useEffect(() => {
    if (reducedMotion) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const ctx = gsap.context(() => {
        const track = trackRef.current;
        const wrap = trackWrapRef.current;
        const pin = pinRef.current;
        if (!track || !wrap || !pin) return;

        const distance = () => Math.max(0, track.scrollWidth - wrap.clientWidth);

        const tween = gsap.to(track, {
          x: () => (isRtl ? distance() : -distance()),
          ease: "none",
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: () => `+=${distance() + window.innerHeight * 1.3}`,
            scrub: 0.6,
            pin: true,
            invalidateOnRefresh: true,
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      }, sectionRef);

      return () => ctx.revert();
    });

    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => mm.revert();
  }, [isRtl, reducedMotion]);

  const t = {
    label: isRtl ? "٠٢ — العملية" : "02 — Process",
    title: isRtl ? "من الطلب للتسليم" : "From requirement to site",
  };

  return (
    <section id="how-it-works" ref={sectionRef} className="bg-white">
      <div ref={pinRef} className="relative overflow-hidden py-[var(--space-section)] lg:flex lg:min-h-screen lg:items-center lg:py-0">
        <div className="w-full">
          <Grid>
            <div className="col-span-4 sm:col-span-8 lg:col-span-12 mb-12 lg:mb-16">
              <p className="type-micro text-brand-dark/45">{t.label}</p>
              <h2 className="type-editorial mt-3 text-brand-dark">{t.title}</h2>
            </div>
          </Grid>

          {/* Desktop: scroll-linked horizontal sequence */}
          {showHorizontalTrack && (
            <div ref={trackWrapRef} className="hidden w-full overflow-hidden lg:block">
              <div ref={trackRef} className="flex gap-[6vw] px-[5vw]" style={{ width: "max-content" }}>
                {steps.map((step, i) => (
                  <div key={step.en} className="w-[56vw] max-w-[680px] shrink-0">
                    <span className="type-editorial text-brand-dark/10">{String(i + 1).padStart(2, "0")}</span>
                    <step.icon className="mt-4 h-8 w-8 text-brand-primary" aria-hidden="true" />
                    <h3 className="type-section-title mt-6 text-brand-dark">{isRtl ? step.ar : step.en}</h3>
                    <p className="type-body mt-3 max-w-md text-brand-dark/55">{isRtl ? step.descAr : step.descEn}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile/tablet always, and desktop too under reduced motion: vertical typographic sequence */}
          <Grid className={showHorizontalTrack ? "lg:hidden" : ""}>
            <div className="relative col-span-4 flex flex-col sm:col-span-8">
              <div
                className={`absolute bottom-2 top-2 w-px bg-brand-dark/10 ${isRtl ? "right-[27px]" : "left-[27px]"}`}
                aria-hidden="true"
              />
              {steps.map((step, i) => (
                <div key={step.en} className="relative flex gap-6 py-8 first:pt-0 last:pb-0">
                  <span className="type-editorial w-14 shrink-0 text-brand-dark/15">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="type-section-title text-brand-dark">{isRtl ? step.ar : step.en}</h3>
                    <p className="type-body mt-2 text-brand-dark/55">{isRtl ? step.descAr : step.descEn}</p>
                  </div>
                </div>
              ))}
            </div>
          </Grid>
        </div>
      </div>
    </section>
  );
}

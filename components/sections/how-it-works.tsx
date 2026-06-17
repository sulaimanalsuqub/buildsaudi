"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ClipboardList, Package, Truck } from "lucide-react";
import { Container } from "@/components/ui/container";

gsap.registerPlugin(ScrollTrigger);

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
  const sectionRef  = useRef<HTMLElement>(null);
  const pinnedRef   = useRef<HTMLDivElement>(null);
  const titleRef    = useRef<HTMLHeadingElement>(null);
  const subRef      = useRef<HTMLParagraphElement>(null);
  const barRef      = useRef<HTMLDivElement>(null);
  const cardRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const stripeRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const iconRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs     = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs    = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // ── DESKTOP — pinned scroll reveal ─────────────────────────────────────
      mm.add("(min-width: 768px)", () => {
        // title + subtitle entrance
        gsap.fromTo(
          [titleRef.current, subRef.current],
          { y: 48, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 1.1, ease: "power4.out",
            stagger: 0.14,
            scrollTrigger: { trigger: titleRef.current, start: "top 78%", toggleActions: "play none none reverse" },
          }
        );

        // accent bar
        gsap.fromTo(
          barRef.current,
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1, opacity: 1, duration: 0.7, ease: "power3.out",
            transformOrigin: isRtl ? "right center" : "left center",
            scrollTrigger: { trigger: titleRef.current, start: "top 78%", toggleActions: "play none none reverse" },
          }
        );

        // pin the inner layout while cards reveal on scroll
        const pin = ScrollTrigger.create({
          trigger: pinnedRef.current,
          start: "top top",
          end: "+=240%",
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pinnedRef.current,
            start: "top top",
            end: "+=240%",
            scrub: 0.9,
          },
        });

        steps.forEach((_, i) => {
          const offset = i * 0.33;

          // card clip-path reveal
          tl.fromTo(
            cardRefs.current[i],
            { clipPath: "inset(100% 0% 0% 0%)", y: 0 },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 0.28, ease: "power2.out" },
            offset
          );

          // green stripe expands across card top
          tl.fromTo(
            stripeRefs.current[i],
            { scaleX: 0 },
            { scaleX: 1, duration: 0.18, ease: "power2.inOut",
              transformOrigin: isRtl ? "right center" : "left center" },
            offset + 0.05
          );

          // icon box fills
          tl.fromTo(
            iconRefs.current[i],
            { scale: 0, backgroundColor: "rgba(9,177,75,0)" },
            { scale: 1, backgroundColor: "#09B14B", duration: 0.22, ease: "back.out(4)" },
            offset + 0.1
          );

          // dot pulse outward
          tl.fromTo(
            dotRefs.current[i],
            { scale: 1, opacity: 0.5 },
            { scale: 2.8, opacity: 0, duration: 0.18, ease: "power2.out" },
            offset + 0.13
          );

          // text fades up
          tl.fromTo(
            textRefs.current[i],
            { y: 22, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.22, ease: "power3.out" },
            offset + 0.14
          );
        });

        return () => { pin.kill(); tl.kill(); };
      });

      // ── MOBILE — per-card ScrollTrigger ────────────────────────────────────
      mm.add("(max-width: 767px)", () => {
        gsap.fromTo(
          [titleRef.current, subRef.current],
          { y: 32, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.12,
            scrollTrigger: { trigger: titleRef.current, start: "top 82%", toggleActions: "play none none reverse" } }
        );

        gsap.fromTo(barRef.current, { scaleX: 0 }, {
          scaleX: 1, duration: 0.6, ease: "power3.out",
          transformOrigin: isRtl ? "right center" : "left center",
          scrollTrigger: { trigger: titleRef.current, start: "top 82%", toggleActions: "play none none reverse" },
        });

        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          const st = { trigger: card, start: "top 84%", toggleActions: "play none none reverse" };

          gsap.fromTo(card,
            { clipPath: "inset(100% 0% 0% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power3.out", scrollTrigger: st }
          );
          gsap.fromTo(stripeRefs.current[i], { scaleX: 0 }, {
            scaleX: 1, duration: 0.4, ease: "power2.inOut", delay: 0.1,
            transformOrigin: isRtl ? "right center" : "left center",
            scrollTrigger: st,
          });
          gsap.fromTo(iconRefs.current[i], { scale: 0, backgroundColor: "rgba(9,177,75,0)" }, {
            scale: 1, backgroundColor: "#09B14B", duration: 0.45, ease: "back.out(4)", delay: 0.16,
            scrollTrigger: st,
          });
          gsap.fromTo(dotRefs.current[i], { scale: 1, opacity: 0.5 }, {
            scale: 2.8, opacity: 0, duration: 0.5, ease: "power2.out", delay: 0.2,
            scrollTrigger: st,
          });
          gsap.fromTo(textRefs.current[i], { y: 18, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.5, ease: "power3.out", delay: 0.22,
            scrollTrigger: st,
          });
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [isRtl]);

  const t = {
    title: isRtl ? "كيف نشتغل؟" : "How We Work",
    sub: isRtl
      ? "ثلاث خطوات بسيطة لتأمين مواد مشروعك"
      : "Three simple steps to secure your project materials",
  };

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative overflow-hidden bg-brand-light"
    >

      {/* pinned wrapper */}
      <div ref={pinnedRef} className="relative z-10">
        <Container>
          <div className="py-24 md:py-32">

            {/* ── Header ───────────────────────────────────────── */}
            <div className={`mb-16 max-w-xl ${isRtl ? "text-right" : "text-left"}`}>
              {/* accent bar */}
              <div
                ref={barRef}
                className="mb-5 h-[3px] w-12 rounded-full bg-brand-primary"
                style={{ transform: isRtl ? "scaleX(0)" : "scaleX(0)", transformOrigin: isRtl ? "right center" : "left center" }}
              />
              <h2
                ref={titleRef}
                className="text-4xl font-black tracking-tight text-brand-dark md:text-6xl"
                style={{ opacity: 0 }}
              >
                {t.title}
              </h2>
              <p
                ref={subRef}
                className="mt-4 text-base text-brand-dark/60 md:text-lg"
                style={{ opacity: 0 }}
              >
                {t.sub}
              </p>
            </div>

            {/* ── Cards grid ───────────────────────────────────── */}
            <div className="grid gap-5 md:grid-cols-3">
              {steps.map((step, i) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.en}
                    ref={(el) => { cardRefs.current[i] = el; }}
                    className="relative overflow-hidden rounded-2xl border border-brand-dark/10 bg-white"
                    style={{ clipPath: "inset(100% 0% 0% 0%)" }}
                  >
                    {/* top stripe */}
                    <div
                      ref={(el) => { stripeRefs.current[i] = el; }}
                      className="absolute top-0 inset-x-0 h-[3px] bg-brand-primary"
                      style={{ transform: "scaleX(0)", transformOrigin: isRtl ? "right center" : "left center" }}
                    />

                    <div className="p-7 pt-8">
                      {/* icon + pulse */}
                      <div className="relative mb-6 inline-flex">
                        <div
                          ref={(el) => { dotRefs.current[i] = el; }}
                          className="absolute inset-0 rounded-xl bg-brand-primary/40"
                          style={{ opacity: 0 }}
                        />
                        <div
                          ref={(el) => { iconRefs.current[i] = el; }}
                          className="relative flex h-12 w-12 items-center justify-center rounded-xl"
                          style={{ transform: "scale(0)", backgroundColor: "rgba(9,177,75,0)" }}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                      </div>

                      {/* text */}
                      <div
                        ref={(el) => { textRefs.current[i] = el; }}
                        style={{ opacity: 0 }}
                      >
                        <h3 className={`text-lg font-bold text-brand-dark mb-2 ${isRtl ? "text-right" : "text-left"}`}>
                          {isRtl ? step.ar : step.en}
                        </h3>
                        <p className={`text-sm leading-relaxed text-brand-dark/55 ${isRtl ? "text-right" : "text-left"}`}>
                          {isRtl ? step.descAr : step.descEn}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

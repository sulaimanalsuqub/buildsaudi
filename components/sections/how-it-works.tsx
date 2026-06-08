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
  const sectionRef = useRef<HTMLElement>(null);
  const lineProgressRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pulseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const numRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── 1. خط يتحرك مع الـ scroll ──────────────────────
      gsap.fromTo(
        lineProgressRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          transformOrigin: isRtl ? "right center" : "left center",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 55%",
            end: "bottom 75%",
            scrub: 1.2,
          },
        }
      );

      // ── 2. كل خطوة تظهر بشكل مستقل مع ScrollTrigger خاص بها ──
      stepRefs.current.forEach((step, i) => {
        if (!step) return;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: step,
            start: "top 72%",
            toggleActions: "play none none reverse",
          },
        });

        // رقم الخطوة يُكشف بـ clip-path من الأسفل
        tl.fromTo(
          numRefs.current[i],
          { clipPath: "inset(100% 0% 0% 0%)", y: 20, opacity: 0 },
          { clipPath: "inset(0% 0% 0% 0%)", y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
          0
        );

        // النقطة تظهر بـ spring bounce
        tl.fromTo(
          dotRefs.current[i],
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(3)" },
          0.15
        );

        // حلقة pulse تتمدد وتختفي
        tl.fromTo(
          pulseRefs.current[i],
          { scale: 1, opacity: 0.6 },
          { scale: 2.5, opacity: 0, duration: 0.9, ease: "power2.out" },
          0.4
        );

        // البطاقة تظهر بـ 3D entrance
        tl.fromTo(
          cardRefs.current[i],
          {
            y: 60,
            rotateX: -18,
            scale: 0.92,
            opacity: 0,
            transformPerspective: 800,
          },
          {
            y: 0,
            rotateX: 0,
            scale: 1,
            opacity: 1,
            duration: 0.75,
            ease: "power4.out",
          },
          0.2
        );
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
      className="py-20 md:py-32 overflow-hidden"
    >
      <Container>
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-20">
          <h2 className="text-3xl font-black tracking-tight text-brand-dark md:text-5xl">
            {t.title}
          </h2>
          <p className="mt-4 text-lg text-brand-dark/60 max-w-md">{t.sub}</p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* خط الربط — سطح المكتب فقط */}
          <div className="absolute top-[4.25rem] inset-x-[16%] hidden md:block pointer-events-none">
            <div className="relative h-[2px] bg-brand-dark/8 w-full">
              <div
                ref={lineProgressRef}
                className="absolute inset-0 bg-gradient-to-r from-brand-primary/50 via-brand-primary to-brand-primary/50"
                style={{
                  transformOrigin: isRtl ? "right center" : "left center",
                  transform: "scaleX(0)",
                }}
              />
            </div>
          </div>

          <div className="grid gap-14 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const num = String(i + 1).padStart(2, "0");
              return (
                <div
                  key={step.en}
                  ref={(el) => { stepRefs.current[i] = el; }}
                  className="flex flex-col items-center text-center"
                >
                  {/* رقم الخطوة */}
                  <span
                    ref={(el) => { numRefs.current[i] = el; }}
                    className="mb-4 text-6xl font-black tabular-nums leading-none text-brand-primary/15 select-none"
                    style={{ clipPath: "inset(100% 0% 0% 0%)" }}
                  >
                    {num}
                  </span>

                  {/* الدائرة + pulse */}
                  <div className="relative mb-8">
                    {/* حلقة pulse خلف النقطة */}
                    <div
                      ref={(el) => { pulseRefs.current[i] = el; }}
                      className="absolute inset-0 rounded-full bg-brand-primary/25 opacity-0"
                      style={{ transform: "scale(1)" }}
                    />
                    <div
                      ref={(el) => { dotRefs.current[i] = el; }}
                      className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white border-2 border-brand-primary shadow-lg shadow-brand-primary/20"
                      style={{ transform: "scale(0)", opacity: 0 }}
                    >
                      <Icon className="h-7 w-7 text-brand-primary" />
                    </div>
                  </div>

                  {/* البطاقة */}
                  <div
                    ref={(el) => { cardRefs.current[i] = el; }}
                    className="w-full rounded-3xl border border-brand-dark/8 bg-white p-8 shadow-sm"
                    style={{ opacity: 0 }}
                  >
                    <h3 className="text-lg font-bold text-brand-dark mb-3">
                      {isRtl ? step.ar : step.en}
                    </h3>
                    <p className="text-sm leading-relaxed text-brand-dark/55">
                      {isRtl ? step.descAr : step.descEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

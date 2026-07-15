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
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [titleRef.current, subRef.current],
        { y: 18, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.08,
          scrollTrigger: { trigger: titleRef.current, start: "top 85%", toggleActions: "play none none reverse" },
        }
      );

      const steps = stepRefs.current.filter(Boolean);
      if (steps.length) {
        gsap.fromTo(
          steps,
          { y: 18, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.08,
            scrollTrigger: { trigger: steps[0], start: "top 88%", toggleActions: "play none none reverse" },
          }
        );
      }
    }, sectionRef);

    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => ctx.revert();
  }, [isRtl]);

  const t = {
    label: isRtl ? "العملية" : "Process",
    title: isRtl ? "كيف نشتغل؟" : "How We Work",
    sub: isRtl
      ? "ثلاث خطوات بسيطة لتأمين مواد مشروعك"
      : "Three simple steps to secure your project materials",
  };

  return (
    <section id="how-it-works" ref={sectionRef} className="bg-white py-20 md:py-28">
      <Container>
        <div className="max-w-2xl text-start">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-[2px] w-8 bg-brand-primary" />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-dark/55">
              {t.label}
            </span>
          </div>
          <h2 ref={titleRef} className="type-section-title text-brand-dark" style={{ opacity: 0 }}>
            {t.title}
          </h2>
          <p ref={subRef} className="type-body mt-3 text-brand-dark/60" style={{ opacity: 0 }}>
            {t.sub}
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden border border-brand-dark/10 bg-brand-dark/10 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.en}
                ref={(el) => { stepRefs.current[i] = el; }}
                className="flex flex-col bg-white p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-dark/15 text-brand-dark">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-lg font-bold text-brand-dark">
                  {isRtl ? step.ar : step.en}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-dark/55">
                  {isRtl ? step.descAr : step.descEn}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

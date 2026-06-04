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
  const lineRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // خط يمتد من اليسار لليمين
      gsap.fromTo(
        lineRef.current,
        { scaleX: 0, transformOrigin: isRtl ? "right center" : "left center" },
        {
          scaleX: 1,
          duration: 1.2,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // نقاط الـ dots تظهر بالتتابع
      gsap.fromTo(
        dotRefs.current,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          ease: "back.out(2)",
          stagger: 0.3,
          delay: 0.3,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // البطاقات ترتفع بالتتابع
      gsap.fromTo(
        cardRefs.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.2,
          delay: 0.2,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // الأيقونات تدور خفيفاً عند الظهور
      gsap.fromTo(
        iconRefs.current,
        { rotate: -15, scale: 0.7, opacity: 0 },
        {
          rotate: 0,
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: "back.out(1.7)",
          stagger: 0.2,
          delay: 0.4,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

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
          <p className="mt-4 text-lg text-brand-dark/60 max-w-md">
            {t.sub}
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* خط الربط */}
          <div className="absolute top-8 inset-x-[10%] hidden md:block">
            <div className="relative h-[2px] bg-brand-dark/8 w-full">
              <div
                ref={lineRef}
                className="absolute inset-0 bg-gradient-to-r from-brand-primary/60 via-brand-primary to-brand-primary/60 origin-left"
                style={{ transform: "scaleX(0)" }}
              />
            </div>
          </div>

          {/* نقاط التوقف والبطاقات */}
          <div className="grid gap-10 md:grid-cols-3 md:gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.en} className="flex flex-col items-center text-center">
                  {/* الدائرة */}
                  <div
                    ref={(el) => { dotRefs.current[i] = el; }}
                    className="relative z-10 mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-white border-2 border-brand-primary shadow-lg shadow-brand-primary/15"
                  >
                    <div
                      ref={(el) => { iconRefs.current[i] = el; }}
                    >
                      <Icon className="h-7 w-7 text-brand-primary" />
                    </div>
                  </div>

                  {/* البطاقة */}
                  <div
                    ref={(el) => { cardRefs.current[i] = el; }}
                    className="w-full rounded-3xl border border-brand-dark/8 bg-white p-8 shadow-sm"
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

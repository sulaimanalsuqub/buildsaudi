"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ensureScrollTrigger } from "@/lib/motion";
import { ArrowLeft, ArrowRight, Check, FileText, MapPin } from "lucide-react";



const steps = [
  {
    ar: "أرسل احتياجاتك",
    en: "Share your requirements",
    descAr: "ارفع جدول الكميات أو أضف المواد التي تحتاجها، وحدّد موقع مشروعك. من هنا تبدأ الرحلة.",
    descEn: "Upload your BOQ or add the materials you need, then tell us where your project is. Your journey starts here.",
    labelAr: "كل التفاصيل، في طلب واحد",
    labelEn: "Every detail. One request.",
    detailAr: "المواد · الكميات · موقع المشروع",
    detailEn: "Materials · Quantities · Project location",
  },
  {
    ar: "نجهّز عرض السعر",
    en: "We prepare your quote",
    descAr: "نراجع احتياجات مشروعك ونرتّب لك عرض سعر واضحاً، لتراجع التفاصيل وتعتمد ما يناسبك.",
    descEn: "We review your project requirements and put together a clear quote, ready for you to review and approve.",
    labelAr: "تفاصيل واضحة، وقرار أسهل",
    labelEn: "Clear details. An easier decision.",
    detailAr: "مراجعة الاحتياجات · تجهيز العرض · اعتمادك",
    detailEn: "Review requirements · Prepare quote · Your approval",
  },
  {
    ar: "نوصّل لموقعك",
    en: "Delivered to your site",
    descAr: "بعد اعتماد العرض، ننسّق التوريد والتوصيل إلى موقع مشروعك. احتياجاتك تصل، والعمل يستمر.",
    descEn: "Once you approve the quote, we coordinate supply and delivery to your project site. Materials arrive. Work moves forward.",
    labelAr: "من احتياجك، إلى أرض مشروعك",
    labelEn: "From your requirements to your site.",
    detailAr: "تنسيق التوريد · التوصيل · الاستلام",
    detailEn: "Coordinate supply · Deliver · Receive",
  },
];

export function HowItWorks({ isRtl = false }: { isRtl?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const DirectionArrow = isRtl ? ArrowLeft : ArrowRight;

  useEffect(() => {
    ensureScrollTrigger();
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)", () => {
      const section = root.current;
      if (!section) return;
      const panels = Array.from(section.querySelectorAll<HTMLElement>(".chapter"));
      section.classList.add("journey-enhanced");
      gsap.set(panels.slice(1), { yPercent: 105 });
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${window.innerHeight * 2.2}`,
          pin: true,
          scrub: 0.65,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          const time = timeline.time();
          const index = time < 1.05 ? 0 : time < 2.05 ? 1 : 2;
          setActiveStep(index);
          panels.forEach((panel, i) => { panel.inert = i !== index; });
        },
      });
      timeline.to({}, {duration: 0.5});
      panels.slice(1).forEach((panel, i) => {
        const at = i + 0.5;
        timeline.to(panels[i], {scale: 0.94, opacity: 0.35, duration: 0.8, ease: "none"}, at);
        timeline.to(panel, {yPercent: 0, duration: 0.8, ease: "none"}, at);
        timeline.fromTo(panel.querySelector(".chapter-object"), {y: 55, rotate: isRtl ? -5 : 5}, {y: 0, rotate: 0, duration: 0.8, ease: "none"}, at);
      });
      timeline.to({}, {duration: 0.5});
      trigger.current = timeline.scrollTrigger ?? null;
      panels.forEach((panel, i) => { panel.inert = i !== 0; });
      return () => {
        trigger.current = null;
        section.classList.remove("journey-enhanced");
        panels.forEach(panel => { panel.inert = false; });
      };
    }, root);
    return () => mm.revert();
  }, [isRtl]);

  function goToStep(index: number) {
    const current = trigger.current;
    if (current) {
      const progress = [0, 1.35 / 2.8, 1][index];
      window.scrollTo({top: current.start + (current.end - current.start) * progress, behavior: "instant"});
    } else {
      root.current?.querySelector(`#supply-chapter-${index}`)?.scrollIntoView({block: "start", behavior: "instant"});
    }
  }

  return (
    <section ref={root} id="how-it-works" aria-labelledby="journey-title" dir={isRtl ? "rtl" : "ltr"} className="journey-story bg-brand-dark text-brand-light">
      <div className="journey-shell">
        <div className="journey-top">
          <h2 id="journey-title" className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{isRtl ? "من الطلب للتسليم" : "From request to delivery"}</h2>
          <p className="max-w-sm text-sm leading-7 text-brand-light/80">{isRtl ? "ثلاث خطوات واضحة. نرتّب تفاصيل التوريد، وتتفرّغ أنت لمشروعك." : "Three clear steps. We handle the supply details, so you can focus on your project."}</p>
        </div>
        <nav className="chapter-nav" aria-label={isRtl ? "مراحل التوريد" : "Supply stages"}>
          {steps.map((step, i) => <button key={step.en} type="button" aria-controls={`supply-chapter-${i}`} aria-current={activeStep === i ? "step" : undefined} onClick={() => goToStep(i)} className={`chapter-nav-button ${activeStep === i ? "is-active" : ""}`}><span dir="ltr">0{i + 1}</span><span>{isRtl ? step.ar : step.en}</span><DirectionArrow className="ms-auto hidden h-4 w-4 sm:block" aria-hidden="true" /></button>)}
        </nav>
        <div className="chapter-stage">
          {steps.map((step, i) => (
            <article key={step.en} id={`supply-chapter-${i}`} className={`chapter chapter-${i}`} aria-labelledby={`chapter-title-${i}`}>
              <div className="chapter-copy">
                <span className="chapter-number" aria-hidden="true">0{i + 1}</span>
                <h3 id={`chapter-title-${i}`} className="chapter-title">{isRtl ? step.ar : step.en}</h3>
                <p className="mt-5 max-w-md text-base leading-8 opacity-80">{isRtl ? step.descAr : step.descEn}</p>
                <p className="mt-7 border-t border-current/20 pt-5 text-xs font-semibold leading-6 sm:text-sm">{isRtl ? step.detailAr : step.detailEn}</p>
              </div>
              <div className="chapter-art">
                <div className="chapter-object">
                  {i < 2 ? (
                    <div className={`supply-document ${i === 1 ? "quote-document" : ""}`}>
                      <div className="flex items-center justify-between border-b border-brand-dark/20 pb-5"><Image src={isRtl ? "/brand/logo-ar.svg" : "/brand/logo-en.svg"} width={4302} height={1500} alt="" className="h-8 w-auto" /><span className="text-xs text-brand-dark/65">{isRtl ? "توضيح رحلة الطلب" : "Journey illustration"}</span></div>
                      <div className="mb-7 mt-8 flex items-center gap-3"><FileText className="h-6 w-6" aria-hidden="true" /><p className="text-xl font-bold">{isRtl ? (i === 0 ? "احتياجات المشروع" : "عرض السعر") : (i === 0 ? "Project requirements" : "Your quotation")}</p></div>
                      {(isRtl ? (i === 0 ? ["المواد المطلوبة", "الكميات والمواصفات", "موقع المشروع"] : ["مراجعة الأصناف", "تفاصيل الأسعار", "اعتماد العرض"]) : (i === 0 ? ["Required materials", "Quantities & specifications", "Project location"] : ["Review materials", "Pricing details", "Approve quotation"])).map((label) => <div key={label} className="flex items-center gap-3 border-b border-brand-dark/10 py-4 text-sm"><Check className="h-4 w-4 text-brand-primary" aria-hidden="true" />{label}</div>)}
                      <div className="mt-7 flex items-center justify-between bg-brand-dark p-4 text-sm font-bold text-brand-light"><span>{isRtl ? step.labelAr : step.labelEn}</span><DirectionArrow className="h-5 w-5 shrink-0" aria-hidden="true" /></div>
                    </div>
                  ) : (
                    <div className="delivery-object">
                      <MapPin className="mx-auto mb-5 h-12 w-12" strokeWidth={1.2} aria-hidden="true" />
                      <Image src="/images/build-truck-vendor.png" alt={isRtl ? "شاحنة بيلد للتوريد" : "Build supply truck"} width={2048} height={1134} sizes="(min-width: 1024px) 45vw, 90vw" className="h-auto w-full mix-blend-multiply" />
                      <p className="border-t border-brand-dark/30 pt-5 text-center text-lg font-bold">{isRtl ? step.labelAr : step.labelEn}</p>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="journey-bottom"><span>{isRtl ? "احتياجاتك تصل، والعمل يستمر." : "Materials arrive. Work moves forward."}</span><Link href={isRtl ? "/ar/get-quote" : "/get-quote"} className="inline-flex min-h-11 items-center gap-4 font-bold text-brand-accent">{isRtl ? "ابدأ طلبك" : "Start your request"}<DirectionArrow className="h-4 w-4" aria-hidden="true" /></Link></div>
      </div>
    </section>
  );
}

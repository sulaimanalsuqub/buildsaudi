"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, FileText, MapPin, Plus } from "lucide-react";

import { Grid } from "@/components/ui/grid";

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

/** Code-drawn illustrations share the site's palette and stay crisp at any size. */
function JourneyDrawing({ step }: { step: number }) {
  return (
    <svg viewBox="0 0 520 300" fill="none" className="h-full w-full" aria-hidden="true">
      <circle cx="260" cy="150" r="126" stroke="currentColor" strokeOpacity=".1" />
      <circle cx="260" cy="150" r="96" stroke="currentColor" strokeOpacity=".07" />
      {step === 0 && (
        <>
          <rect x="157" y="50" width="186" height="218" rx="8" fill="#05B04C" transform="rotate(-9 157 50)" />
          <rect x="172" y="33" width="186" height="226" rx="8" fill="#F4F3EB" />
          <path d="M301 33v45h57" fill="#DCE5CF" />
          <path d="M204 78h58M204 94h39" stroke="#1D3F1F" strokeWidth="5" strokeLinecap="round" />
          {[127, 163, 199].map((y) => (
            <g key={y}>
              <rect x="203" y={y} width="17" height="17" rx="3" fill="#1D3F1F" fillOpacity=".08" />
              <path d={`M232 ${y + 4}h91M232 ${y + 13}h58`} stroke="#1D3F1F" strokeOpacity=".25" strokeWidth="4" strokeLinecap="round" />
            </g>
          ))}
          <circle cx="353" cy="204" r="33" fill="#C5D92D" />
          <path d="M353 218v-28m-10 10 10-10 10 10" stroke="#1D3F1F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M132 106h-20m10-10v20M395 123h-14m7-7v14" stroke="#C5D92D" strokeWidth="2" />
        </>
      )}
      {step === 1 && (
        <>
          <rect x="125" y="68" width="244" height="187" rx="8" fill="#05B04C" transform="rotate(-6 125 68)" />
          <rect x="139" y="48" width="244" height="192" rx="8" fill="#F4F3EB" />
          <rect x="139" y="48" width="244" height="43" rx="8" fill="#DCE5CF" />
          <path d="M163 70h75" stroke="#1D3F1F" strokeWidth="5" strokeLinecap="round" />
          <circle cx="358" cy="69" r="6" fill="#05B04C" />
          {[116, 147, 178].map((y) => (
            <g key={y}>
              <path d={`M163 ${y}h84M301 ${y}h57`} stroke="#1D3F1F" strokeOpacity=".23" strokeWidth="5" strokeLinecap="round" />
              <path d={`M163 ${y + 15}h195`} stroke="#1D3F1F" strokeOpacity=".1" />
            </g>
          ))}
          <path d="M163 215h49M310 215h48" stroke="#1D3F1F" strokeWidth="6" strokeLinecap="round" />
          <circle cx="375" cy="212" r="34" fill="#C5D92D" />
          <path d="m359 212 11 11 20-23" stroke="#1D3F1F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {step === 2 && (
        <>
          <path d="M85 248h355" stroke="#F4F3EB" strokeOpacity=".3" strokeLinecap="round" />
          <path d="M330 202V85h59v117M345 85V65h29v20M318 202h88" stroke="#F4F3EB" strokeOpacity=".35" strokeWidth="2" />
          {[105, 130, 155].map((y) => <path key={y} d={`M342 ${y}h10m14 0h10`} stroke="#F4F3EB" strokeOpacity=".35" strokeWidth="6" />)}
          <path d="M285 62c0-15-12-27-27-27s-27 12-27 27c0 20 27 40 27 40s27-20 27-40Z" fill="#C5D92D" />
          <circle cx="258" cy="62" r="9" fill="#1D3F1F" />
          <path d="M124 138h147v90H124z" fill="#F4F3EB" />
          <path d="M271 167h37l32 34v27h-69v-61Z" fill="#05B04C" />
          <path d="M282 178h22l19 22h-41v-22Z" fill="#1D3F1F" />
          <path d="M147 159h99v48h-99z" stroke="#1D3F1F" strokeOpacity=".18" />
          <path d="M179 159v48m34-48v48" stroke="#1D3F1F" strokeOpacity=".18" />
          <path d="M115 228h231" stroke="#DCE5CF" strokeWidth="7" />
          {[164, 306].map((x) => <g key={x}><circle cx={x} cy="232" r="18" fill="#1D3F1F" stroke="#F4F3EB" strokeWidth="3" /><circle cx={x} cy="232" r="6" fill="#C5D92D" /></g>)}
          <path d="M86 164h22M73 182h35M88 200h20" stroke="#C5D92D" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function HowItWorks({ isRtl = false }: HowItWorksProps) {
  const [activeStep, setActiveStep] = useState(0);
  const active = steps[activeStep];
  const DirectionArrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section id="how-it-works" aria-labelledby="journey-title" dir={isRtl ? "rtl" : "ltr"} className="scroll-mt-24 bg-brand-light py-[var(--space-section)]">
      <Grid>
        <div className="col-span-4 mb-10 sm:col-span-8 lg:col-span-12 lg:mb-14">
          <div className="mb-5 flex items-center gap-3 text-sm font-semibold text-brand-dark/65">
            <span className="h-2 w-2 bg-brand-primary" aria-hidden="true" />
            {isRtl ? "رحلة التوريد مع بيلد" : "Your supply journey with Build"}
          </div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <h2 id="journey-title" className="type-editorial text-brand-dark">{isRtl ? "من الطلب للتسليم" : "From requirement to site"}</h2>
            <p className="type-body max-w-xs shrink-0 text-brand-dark/65">
              {isRtl ? "ثلاث خطوات واضحة. نرتّب تفاصيل التوريد، وتتفرّغ أنت لمشروعك." : "Three clear steps. We handle the supply details, so you can focus on your project."}
            </p>
          </div>
        </div>

        <div className="col-span-4 sm:col-span-8 lg:col-span-5 lg:pe-8">
          <ol className="border-t border-brand-dark/20">
            {steps.map((step, i) => (
              <li key={step.en} className="border-b border-brand-dark/20">
                <button type="button" onClick={() => setActiveStep(i)} aria-pressed={activeStep === i} aria-controls="journey-visual" className="group w-full py-6 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary sm:py-7">
                  <span className="flex items-center gap-4">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors motion-reduce:transition-none ${activeStep === i ? "bg-brand-dark text-brand-light" : "border border-brand-dark/20 text-brand-dark/50 group-hover:border-brand-primary"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={`flex-1 text-xl font-bold transition-colors sm:text-2xl ${activeStep === i ? "text-brand-dark" : "text-brand-dark/60 group-hover:text-brand-dark"}`}>{isRtl ? step.ar : step.en}</span>
                    {activeStep === i ? <DirectionArrow className="h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" /> : <Plus className="h-4 w-4 shrink-0 text-brand-dark/45" aria-hidden="true" />}
                  </span>
                  <span className={`grid transition-[grid-template-rows,opacity] duration-300 motion-reduce:transition-none ${activeStep === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <span className="overflow-hidden"><span className="type-body block ps-[52px] pt-4 text-brand-dark/65">{isRtl ? step.descAr : step.descEn}</span></span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <Link href={isRtl ? "/ar/get-quote" : "/get-quote"} className="my-8 inline-flex items-center gap-3 border-b border-brand-dark pb-2 text-sm font-bold text-brand-dark transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary lg:mb-0">
            {isRtl ? "ابدأ بطلب عرض سعر" : "Start with a quote"}<DirectionArrow className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div id="journey-visual" role="region" aria-label={isRtl ? "تفاصيل الخطوة" : "Step details"} aria-live="polite" className="relative col-span-4 flex min-w-0 flex-col overflow-hidden rounded-sm bg-brand-dark text-brand-light sm:col-span-8 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-9">
            <span className="flex items-center gap-2 text-xs font-medium text-brand-light/75">
              {activeStep === 2 ? <MapPin className="h-4 w-4 text-brand-accent" aria-hidden="true" /> : <FileText className="h-4 w-4 text-brand-accent" aria-hidden="true" />}
              {isRtl ? "رحلتك، خطوة بخطوة" : "Your journey, step by step"}
            </span>
            <span dir="ltr" className="text-xs tabular-nums tracking-[0.15em]"><span className="text-brand-accent">0{activeStep + 1}</span><span className="text-white/40"> / 03</span></span>
          </div>
          <div className="flex flex-1 flex-col justify-center px-6 pb-7 pt-4 sm:px-9 sm:pb-9">
            <div key={activeStep} className="journey-scene mx-auto aspect-[520/300] w-full max-w-[520px]"><JourneyDrawing step={activeStep} /></div>
            <div className="text-center">
              <h3 className="text-xl font-bold sm:text-2xl">{isRtl ? active.labelAr : active.labelEn}</h3>
              <p className="mt-3 text-xs leading-6 text-brand-light/65 sm:text-sm">{isRtl ? active.detailAr : active.detailEn}</p>
            </div>
          </div>
          <div className="flex border-t border-white/15" aria-label={isRtl ? "اختيار خطوة" : "Choose a step"}>
            {steps.map((step, i) => (
              <button key={step.en} type="button" onClick={() => setActiveStep(i)} aria-label={isRtl ? step.ar : step.en} aria-pressed={i === activeStep} className={`relative flex min-h-14 flex-1 items-center justify-center gap-2 px-2 text-xs transition-colors focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-brand-accent ${i === activeStep ? "bg-white/10 text-brand-accent" : "text-brand-light/60 hover:bg-white/5 hover:text-brand-light"}`}>
                {i < activeStep ? <Check className="h-3 w-3" aria-hidden="true" /> : <span className={`h-1.5 w-1.5 rounded-full ${i === activeStep ? "bg-brand-accent" : "bg-current opacity-40"}`} aria-hidden="true" />}
                {isRtl ? ["الطلب", "عرض السعر", "التسليم"][i] : ["Request", "Quote", "Delivery"][i]}
                {i === activeStep && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-accent" />}
              </button>
            ))}
          </div>
        </div>
      </Grid>
      <style jsx>{`
        @keyframes journey-enter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .journey-scene { animation: journey-enter 350ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .journey-scene { animation: none; }
        }
      `}</style>
    </section>
  );
}

type HowItWorksProps = { isRtl?: boolean };

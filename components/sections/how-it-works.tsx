"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, ChevronDown, FileText, MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";

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
  const [activeStep, setActiveStep] = useState(0);
  const DirectionArrow = isRtl ? ArrowLeft : ArrowRight;
  const step = steps[activeStep];

  return (
    <section id="how-it-works" aria-labelledby="journey-title" className="supply-journey home-section">
      <Container>
        <div className="home-section-heading">
          <h2 id="journey-title" className="home-heading">{isRtl ? "من الطلب للتسليم" : "From request to delivery"}</h2>
          <p>{isRtl ? "ثلاث خطوات واضحة. نرتّب تفاصيل التوريد، وتتفرّغ أنت لمشروعك." : "Three clear steps. We handle the supply details, so you can focus on your project."}</p>
        </div>
        <div className="supply-journey-layout">
          <div className="supply-steps">
            {steps.map((item, index) => (
              <div key={item.en} className="supply-step" data-active={activeStep === index}>
                <h3>
                  <button type="button" id={`step-button-${index}`} aria-expanded={activeStep === index} aria-controls={`step-description-${index}`} onClick={() => setActiveStep(index)}>
                    <span className="supply-step-number">{index + 1}</span>
                    <span>{isRtl ? item.ar : item.en}</span>
                    <ChevronDown size={18} aria-hidden="true" />
                  </button>
                </h3>
                <div id={`step-description-${index}`} role="region" aria-labelledby={`step-button-${index}`} hidden={activeStep !== index} className="supply-step-description">
                  <p>{isRtl ? item.descAr : item.descEn}</p>
                  <p className="supply-step-detail">{isRtl ? item.detailAr : item.detailEn}</p>
                </div>
              </div>
            ))}
            <Link href={isRtl ? "/ar/get-quote" : "/get-quote"} className="home-text-link supply-start">{isRtl ? "ابدأ طلبك" : "Start your request"}<DirectionArrow size={17} aria-hidden="true" /></Link>
          </div>
          <div className="supply-illustration" aria-hidden="true">
            {activeStep < 2 ? (
              <div className="supply-document">
                <div className="supply-document-header"><Image src={isRtl ? "/brand/logo-ar.png" : "/brand/logo-en.png"} width={isRtl ? 2883 : 2846} height={isRtl ? 1231 : 1287} alt="" className="h-8 w-auto" /><span>{isRtl ? "توضيح رحلة الطلب" : "Journey illustration"}</span></div>
                <div className="supply-document-title"><FileText size={23} strokeWidth={1.5} /><p>{isRtl ? (activeStep === 0 ? "احتياجات المشروع" : "عرض السعر") : (activeStep === 0 ? "Project requirements" : "Your quotation")}</p></div>
                {(isRtl ? (activeStep === 0 ? ["المواد المطلوبة", "الكميات والمواصفات", "موقع المشروع"] : ["مراجعة الأصناف", "تفاصيل الأسعار", "اعتماد العرض"]) : (activeStep === 0 ? ["Required materials", "Quantities & specifications", "Project location"] : ["Review materials", "Pricing details", "Approve quotation"])).map((label) => <div key={label} className="supply-document-row"><Check size={16} /><span>{label}</span></div>)}
                <div className="supply-document-note">{isRtl ? step.labelAr : step.labelEn}<DirectionArrow size={17} /></div>
              </div>
            ) : (
              <div className="delivery-object">
                <MapPin className="mx-auto" size={36} strokeWidth={1.5} />
                <Image src="/images/build-truck-vendor.png" alt="" width={2048} height={1134} sizes="(min-width: 1024px) 480px, 85vw" className="h-auto w-full" />
                <p>{isRtl ? step.labelAr : step.labelEn}</p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

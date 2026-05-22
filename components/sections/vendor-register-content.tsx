import {
  BadgeCheck,
  Building2,
  Clock3,
  FileCheck2,
  Handshake,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { VendorRegistrationForm } from "@/components/forms/vendor-registration-form";
import { Container } from "@/components/ui/container";

type VendorRegisterContentProps = {
  isRtl?: boolean;
};

const proofItems = [
  { icon: Building2, en: "Active project requests", ar: "طلبات مشاريع نشطة" },
  { icon: ShieldCheck, en: "Qualified supplier review", ar: "مراجعة تأهيل للموردين" },
  { icon: Truck, en: "Delivery coverage matching", ar: "مطابقة حسب مناطق التغطية" },
];

const benefits = [
  {
    icon: FileCheck2,
    enTitle: "Receive clearer RFQs",
    arTitle: "استقبل طلبات تسعير أوضح",
    enBody: "Project needs, quantities, delivery location, and target dates are collected before opportunities reach you.",
    arBody: "نجمع احتياج المشروع والكميات وموقع التسليم والتاريخ المستهدف قبل وصول الفرصة لكم.",
  },
  {
    icon: Handshake,
    enTitle: "Compete on relevant work",
    arTitle: "نافس على فرص مناسبة",
    enBody: "Your categories, regions, payment terms, and supplier type help Build route the right requests to your team.",
    arBody: "فئاتكم ومناطق تغطيتكم وشروط الدفع ونوع المورد تساعد بيلد على توجيه الطلبات المناسبة لكم.",
  },
  {
    icon: BadgeCheck,
    enTitle: "Build a preferred profile",
    arTitle: "ابنِ ملف مورد مفضل",
    enBody: "Approved vendors can be shortlisted faster for repeat orders and project-specific sourcing workflows.",
    arBody: "الموردون المعتمدون يمكن ترشيحهم أسرع للطلبات المتكررة وتدفقات توريد المشاريع.",
  },
];

const steps = [
  { en: "Submit supplier details", ar: "أرسل بيانات المورد" },
  { en: "Build reviews the fit", ar: "يراجع فريق بيلد الملاءمة" },
  { en: "Receive matching RFQs", ar: "استقبل طلبات تسعير مناسبة" },
];

export function VendorRegisterContent({ isRtl = false }: VendorRegisterContentProps) {
  const t = {
    badge: isRtl ? "برنامج موردي بيلد" : "Build Supplier Program",
    title: isRtl ? "كُن موردًا معتمدًا لمشاريع البناء" : "Become a Qualified Supplier for Construction Projects",
    body: isRtl
      ? "سجّل منشأتك مرة واحدة، ودع فريق بيلد يطابق منتجاتك ومناطق تغطيتك مع طلبات شراء حقيقية من مشاريع نشطة داخل المملكة."
      : "Register your company once, then let Build match your products and coverage areas with real purchasing requests from active projects across Saudi Arabia.",
    primary: isRtl ? "ابدأ التسجيل" : "Start registration",
    time: isRtl ? "يستغرق 3 دقائق تقريبًا" : "Takes about 3 minutes",
    benefitTitle: isRtl ? "لماذا ينضم الموردون؟" : "Why Suppliers Join",
    benefitBody: isRtl
      ? "صممنا التجربة لتقليل الطلبات غير المناسبة، وتسريع التأهيل، وتسهيل التواصل التجاري."
      : "The experience is designed to reduce irrelevant requests, speed up qualification, and make commercial follow-up easier.",
    processTitle: isRtl ? "ما الذي يحدث بعد التسجيل؟" : "What Happens After Registration",
    processBody: isRtl
      ? "سنراجع بياناتكم ونستخدمها لتوجيه فرص التوريد الأقرب لنشاطكم."
      : "We review your profile and use it to route supply opportunities that fit your business.",
  };

  return (
    <main className="section-pad" dir={isRtl ? "rtl" : "ltr"}>
      <Container className="space-y-10 md:space-y-14">
        <section className="grid items-center gap-8 pt-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.65fr)]">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-white/80 px-3 py-1 text-sm font-semibold text-brand-primary shadow-soft">
              <BadgeCheck className="h-4 w-4" />
              {t.badge}
            </p>
            <h1 className="type-hero mt-5 text-brand-dark">{t.title}</h1>
            <p className="type-subheading mt-5 text-brand-dark/72">{t.body}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#supplier-registration-form"
                className="inline-flex h-12 items-center justify-center rounded-full bg-brand-dark px-7 text-base font-semibold text-white transition hover:bg-brand-dark/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark/20"
              >
                {t.primary}
              </a>
              <span className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-brand-dark/65 sm:justify-start">
                <Clock3 className="h-4 w-4 text-brand-primary" />
                {t.time}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-dark/10 bg-white p-4 shadow-premium md:p-5">
            <div className="space-y-3">
              {proofItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.en} className="flex items-center gap-3 rounded-xl bg-brand-light/70 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-primary shadow-soft">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold text-brand-dark">{isRtl ? item.ar : item.en}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article key={benefit.enTitle} className="rounded-2xl border border-brand-dark/10 bg-white p-5 shadow-soft">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-bold leading-snug text-brand-dark">
                  {isRtl ? benefit.arTitle : benefit.enTitle}
                </h2>
                <p className="mt-2 text-sm leading-7 text-brand-dark/66">{isRtl ? benefit.arBody : benefit.enBody}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-2xl border border-brand-dark/10 bg-brand-dark p-6 text-white shadow-premium lg:sticky lg:top-24">
            <h2 className="text-2xl font-bold leading-snug">{t.processTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-white/72">{t.processBody}</p>
            <ol className="mt-6 space-y-4">
              {steps.map((step, index) => (
                <li key={step.en} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-sm font-semibold leading-6 text-white/92">{isRtl ? step.ar : step.en}</span>
                </li>
              ))}
            </ol>
          </aside>

          <div id="supplier-registration-form" className="scroll-mt-28">
            <VendorRegistrationForm isRtl={isRtl} />
          </div>
        </section>
      </Container>
    </main>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  ChevronDown,
  ClipboardList,
  Factory,
  FileText,
  Handshake,
  Lightbulb,
  Paintbrush,
  Plug,
  ShieldCheck,
  ShowerHead,
  Snowflake,
  Store,
  Truck,
  Wrench,
} from "lucide-react";

import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type HomeContentProps = {
  isRtl?: boolean;
};

const categories = [
  { en: "Building Materials", ar: "مواد بناء وإنشاء", icon: Building2 },
  { en: "Safety Tools", ar: "أدوات السلامة", icon: ShieldCheck },
  { en: "Paint & Decor", ar: "دهانات وديكور", icon: Paintbrush },
  { en: "Electrical & Lighting", ar: "كهرباء وإنارة", icon: Lightbulb },
  { en: "Plumbing", ar: "سباكة", icon: Wrench },
  { en: "Sanitary Ware", ar: "أدوات صحية", icon: ShowerHead },
  { en: "HVAC", ar: "تكييف وتبريد", icon: Snowflake },
  { en: "Piping Systems", ar: "أنظمة الأنابيب", icon: Plug },
];

export function HomeContent({ isRtl = false }: HomeContentProps) {
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const t = {
    badge: isRtl ? "شبكة موردي مواد البناء" : "Construction Supplier Network",
    heroTitle: isRtl ? "توريد أسرع لمشاريع البناء في السعودية" : "Faster Material Supply for Construction Projects",
    heroSub: isRtl
      ? "بيلد تربط طلبات المشاريع بالموردين المناسبين، وتختصر دورة التسعير من الطلب إلى العرض النهائي والتوصيل."
      : "Build connects project requests with qualified suppliers and shortens the sourcing workflow from request to final offer and delivery.",
    primaryCta: isRtl ? "اطلب المنتجات" : "Order Products",
    supplierCta: isRtl ? "كُن موردًا" : "Become a Supplier",
    statOne: isRtl ? "فئات توريد" : "Supply categories",
    statTwo: isRtl ? "موردون نشطون" : "Active suppliers",
    statThree: isRtl ? "تسعير وتوصيل" : "Quote to delivery",
    howTitle: isRtl ? "رحلة توريد أوضح" : "A Clearer Supply Workflow",
    howBody: isRtl
      ? "كل خطوة مصممة لتقليل الوقت الضائع في البحث، المقارنات، والمتابعة اليدوية."
      : "Every step is designed to reduce time lost on supplier search, comparisons, and manual follow-up.",
    categoriesTitle: isRtl ? "فئات تخدم المشروع بالكامل" : "Categories That Cover the Whole Project",
    categoriesBody: isRtl
      ? "من المواد الأساسية إلى التشطيبات والأنظمة، نرتب الطلبات حسب الفئة والموقع واحتياج المشروع."
      : "From core materials to finishing and systems, requests are organized by category, location, and project need.",
    supplierTitle: isRtl ? "للموردين: فرص مناسبة بدل طلبات عشوائية" : "For Suppliers: Relevant Work, Not Random Requests",
    supplierBody: isRtl
      ? "ملف المورد يساعد فريق بيلد على مطابقة المنتجات، مناطق التغطية، وشروط الدفع مع الطلبات الأقرب لنشاطكم."
      : "A supplier profile helps Build match products, coverage areas, and payment terms with requests that fit your business.",
    quoteCtaTitle: isRtl ? "ابدأ بطلب واحد واضح" : "Start with one clear request",
    quoteCtaBody: isRtl
      ? "أرسل المواد والموقع والتاريخ المطلوب، وسيتعامل الفريق مع التسعير والمتابعة."
      : "Send the materials, site, and target date, then the team handles sourcing and follow-up.",
    faqTitle: isRtl ? "أسئلة مختصرة" : "Quick Answers",
    steps: isRtl
      ? [
          { title: "أرسل احتياج المشروع", body: "المواد، الكميات، الموقع، والموعد المطلوب.", icon: ClipboardList },
          { title: "نطابق الطلب مع الموردين", body: "حسب الفئة والتغطية والقدرة التجارية.", icon: Store },
          { title: "يصلك عرض نهائي", body: "يشمل المواد والشحن وخطوات الاعتماد.", icon: FileText },
        ]
      : [
          { title: "Submit project needs", body: "Materials, quantities, site, and target delivery date.", icon: ClipboardList },
          { title: "Match with suppliers", body: "By category, coverage, and commercial fit.", icon: Store },
          { title: "Receive a final offer", body: "Materials, freight, and approval steps in one flow.", icon: FileText },
        ],
    supplierPoints: isRtl
      ? ["توجيه طلبات تسعير حسب الفئات", "مطابقة حسب مناطق التغطية", "ملف تأهيل للمشاريع المتكررة"]
      : ["RFQs routed by category", "Coverage-area matching", "Qualified profile for repeat projects"],
    faqs: isRtl
      ? [
          { q: "هل بيلد تبيع المواد مباشرة؟", a: "بيلد تنظم طلبات التوريد وتطابقها مع الموردين المناسبين ثم تدير العرض النهائي للعميل." },
          { q: "هل يمكن رفع BOQ؟", a: "نعم، يمكن رفع ملف BOQ أو إضافة رابط جدول عند طلب المنتجات." },
          { q: "كيف ينضم المورد؟", a: "من صفحة كُن موردًا، يرسل المورد بيانات المنشأة والفئات والتغطية وشروط الدفع." },
        ]
      : [
          { q: "Does Build sell materials directly?", a: "Build organizes supply requests, matches them with suitable suppliers, and manages the final offer flow." },
          { q: "Can I upload a BOQ?", a: "Yes, you can upload a BOQ file or include an online sheet link when submitting a request." },
          { q: "How does a supplier join?", a: "Through the supplier page, vendors submit company details, categories, coverage, and payment terms." },
        ],
  };

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>
      <section className="relative overflow-hidden bg-brand-dark text-white">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div
          className={cn(
            "absolute inset-y-0 hidden w-[68%] md:block",
            isRtl ? "left-0" : "right-0"
          )}
        >
          <Image
            src="/images/build-truck.png"
            alt={isRtl ? "تطبيق بيلد لتوريد مواد البناء" : "Build construction supply app"}
            fill
            priority
            sizes="100vw"
            className={cn(
              "object-cover opacity-88",
              isRtl ? "object-left" : "object-right"
            )}
          />
          <div
            className={cn(
              "absolute inset-0",
              isRtl
                ? "bg-[linear-gradient(90deg,rgba(29,63,31,0.04)_0%,rgba(29,63,31,0.3)_38%,rgba(29,63,31,0.78)_74%,#1D3F1F_100%)]"
                : "bg-[linear-gradient(270deg,rgba(29,63,31,0.04)_0%,rgba(29,63,31,0.3)_38%,rgba(29,63,31,0.78)_74%,#1D3F1F_100%)]"
            )}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(180deg,rgba(29,63,31,0)_0%,#1D3F1F_92%)]" />

        <Container className="relative min-h-[620px] py-10 md:min-h-[690px] md:py-14">
          <div
            className={cn(
              "absolute inset-y-10 hidden w-[42%] rounded-[36px] border border-white/10 bg-white/[0.04] backdrop-blur-[1px] lg:block",
              isRtl ? "left-8" : "right-8"
            )}
          />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex min-h-[560px] max-w-2xl flex-col justify-center md:min-h-[610px]"
          >
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-sm font-bold text-white shadow-soft backdrop-blur-md">
              <BadgeCheck className="h-4 w-4 text-brand-accent" />
              {t.badge}
            </p>
            <h1 className="type-hero mt-5 text-white">{t.heroTitle}</h1>
            <p className="type-subheading mt-5 text-white/72">{t.heroSub}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={isRtl ? "/ar/get-quote" : "/get-quote"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-primary px-7 text-base font-bold text-white transition hover:bg-white hover:text-brand-dark"
              >
                {t.primaryCta}
                <ArrowIcon className="h-4 w-4" />
              </Link>
              <Link
                href={isRtl ? "/ar/register" : "/register"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/18 bg-white/10 px-7 text-base font-bold text-white backdrop-blur-md transition hover:bg-white hover:text-brand-dark"
              >
                <Factory className="h-4 w-4 text-brand-accent" />
                {t.supplierCta}
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 overflow-hidden rounded-2xl border border-white/12 bg-white/10 shadow-soft backdrop-blur-md">
              <Stat value="12+" label={t.statOne} />
              <Stat value="340" label={t.statTwo} />
              <Stat value="DDP" label={t.statThree} />
            </div>
          </motion.div>
        </Container>
      </section>

      <section className="py-12 md:py-20">
        <Container>
          <SectionHeader title={t.howTitle} body={t.howBody} />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {t.steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.article
                  key={step.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.32, delay: index * 0.08 }}
                  className="rounded-2xl border border-brand-dark/10 bg-white p-6 shadow-soft"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-5 text-sm font-bold text-brand-primary">0{index + 1}</p>
                  <h2 className="mt-2 text-xl font-bold leading-tight text-brand-dark">{step.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-brand-dark/62">{step.body}</p>
                </motion.article>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="bg-white py-12 md:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end">
            <SectionHeader title={t.categoriesTitle} body={t.categoriesBody} align="start" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <article key={category.en} className="rounded-2xl border border-brand-dark/10 bg-brand-light/55 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-primary shadow-soft">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-sm font-bold leading-6 text-brand-dark">{isRtl ? category.ar : category.en}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-20">
        <Container>
          <div className="grid gap-6 overflow-hidden rounded-3xl border border-brand-dark/10 bg-brand-dark p-6 text-white shadow-premium md:p-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white">
              <Handshake className="h-4 w-4 text-brand-accent" />
                {t.supplierCta}
              </p>
              <h2 className="mt-5 text-3xl font-bold leading-tight md:text-4xl">{t.supplierTitle}</h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">{t.supplierBody}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={isRtl ? "/ar/register" : "/register"}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-primary px-7 text-base font-bold text-white transition hover:bg-white hover:text-brand-dark"
                >
                  {t.supplierCta}
                  <ArrowIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="grid gap-3">
              {t.supplierPoints.map((point, index) => (
                <div key={point} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-accent text-sm font-black text-brand-dark">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-white/88">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-12 md:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
            <div>
              <SectionHeader title={t.quoteCtaTitle} body={t.quoteCtaBody} align="start" />
              <Link
                href={isRtl ? "/ar/get-quote" : "/get-quote"}
                className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-dark px-7 text-base font-bold text-white transition hover:bg-brand-primary"
              >
                {t.primaryCta}
                <ArrowIcon className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniMetric icon={Boxes} value="BOQ" label={isRtl ? "رفع الملفات" : "File upload"} />
              <MiniMetric icon={Truck} value="DDP" label={isRtl ? "تسليم للموقع" : "Site delivery"} />
              <MiniMetric icon={BadgeCheck} value="RFQ" label={isRtl ? "موردون مؤهلون" : "Qualified vendors"} />
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-20">
        <Container>
          <SectionHeader title={t.faqTitle} />
          <div className="mx-auto mt-8 max-w-3xl space-y-3">
            {t.faqs.map((item) => (
              <FaqItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}

function SectionHeader({ title, body, align = "center" }: { title: string; body?: string; align?: "center" | "start" }) {
  return (
    <div className={cn(align === "center" ? "mx-auto text-center" : "", "max-w-2xl")}>
      <h2 className="type-section-title text-brand-dark">{title}</h2>
      {body && <p className="type-body mt-3 text-brand-dark/62">{body}</p>}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-e border-brand-dark/10 p-4 last:border-e-0">
      <p className="text-2xl font-black leading-none text-brand-dark">{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-brand-dark/56">{label}</p>
    </div>
  );
}

function MiniMetric({ icon: Icon, value, label }: { icon: typeof Boxes; value: string; label: string }) {
  return (
    <article className="rounded-2xl border border-brand-dark/10 bg-brand-light/55 p-5">
      <Icon className="h-6 w-6 text-brand-primary" />
      <p className="mt-5 text-2xl font-black text-brand-dark">{value}</p>
      <p className="mt-1 text-sm font-semibold text-brand-dark/58">{label}</p>
    </article>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-dark/10 bg-white shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
      >
        <span className="text-sm font-bold text-brand-dark">{question}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-brand-primary transition", open && "rotate-180")} />
      </button>
      {open && <p className="px-5 pb-5 text-sm leading-7 text-brand-dark/62">{answer}</p>}
    </div>
  );
}

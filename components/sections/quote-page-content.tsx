"use client";

import { useState } from "react";
import { CheckCircle2, Check, ClipboardList, Clock, Copy, Mail, SendHorizontal } from "lucide-react";

import { GetQuoteForm } from "@/components/forms/get-quote-form";
import { Container } from "@/components/ui/container";

type QuotePageContentProps = {
  isRtl?: boolean;
};

/** أعد تفعيل النموذج بضبط NEXT_PUBLIC_ENABLE_QUOTE_FORM=true في Vercel ثم أعد النشر */
const QUOTE_FORM_ENABLED = process.env.NEXT_PUBLIC_ENABLE_QUOTE_FORM === "true";
const SALES_EMAIL = "sales@build.sa";

export function QuotePageContent({ isRtl = false }: QuotePageContentProps) {
  const t = QUOTE_FORM_ENABLED
    ? {
        badge: isRtl ? "أطلب المنتجات" : "Order Products",
        title: isRtl ? "أرسل احتياج مشروعك" : "Send Your Project Request",
        body: isRtl
          ? "أدخل المواد المطلوبة، موقع التسليم، والموعد المستهدف. يمكنك إضافة ملف BOQ لتسريع المراجعة."
          : "Enter the required materials, delivery location, and target date. You can attach a BOQ to speed up review.",
      }
    : {
        badge: isRtl ? "طلب عرض سعر" : "Request a Quote",
        title: isRtl ? "تواصل معنا عبر البريد" : "Contact Us by Email",
        body: isRtl
          ? "أرسل تفاصيل مشروعك والمواد المطلوبة إلى فريق المبيعات، وسنعود إليك في أقرب وقت."
          : "Send your project details and required materials to our sales team, and we will get back to you shortly.",
      };

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>
      <section className="bg-white py-12 md:py-16">
        <Container>
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-brand-primary/8 px-4 py-1.5 text-sm font-semibold text-brand-primary">
              <ClipboardList className="h-4 w-4" />
              {t.badge}
            </span>
            <h1 className="type-hero mt-5 text-brand-dark">{t.title}</h1>
            <p className="type-subheading mt-4 max-w-lg text-brand-dark/62">{t.body}</p>
          </div>
        </Container>
      </section>

      <section className="bg-[#f7f9f6] py-10 md:py-14">
        <Container>
          <div className="mx-auto max-w-4xl">
            {QUOTE_FORM_ENABLED ? (
              <GetQuoteForm isRtl={isRtl} />
            ) : (
              <QuoteEmailFallback isRtl={isRtl} />
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}

function QuoteEmailFallback({ isRtl }: { isRtl: boolean }) {
  const [copied, setCopied] = useState(false);

  const subject = isRtl
    ? "طلب عرض سعر — مواد بناء"
    : "Quote Request — Building Materials";
  const body = isRtl
    ? [
        "السلام عليكم،",
        "",
        "أرغب بطلب عرض سعر لمواد البناء:",
        "",
        "اسم المنشأة / العميل:",
        "رقم الجوال:",
        "مدينة التسليم:",
        "المواد المطلوبة / ملخص جدول الكميات:",
        "",
        "شكراً لكم.",
      ].join("\n")
    : [
        "Hello,",
        "",
        "I would like a quote for building materials:",
        "",
        "Company / client name:",
        "Mobile:",
        "Delivery city:",
        "Required materials / BOQ summary:",
        "",
        "Thank you.",
      ].join("\n");

  const encSubject = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);
  const encTo = encodeURIComponent(SALES_EMAIL);

  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encTo}&su=${encSubject}&body=${encBody}`;
  const outlookHref = `https://outlook.live.com/mail/0/deeplink/compose?to=${encTo}&subject=${encSubject}&body=${encBody}`;
  const otherHref = `mailto:${SALES_EMAIL}?subject=${encSubject}&body=${encBody}`;

  const checklist = isRtl
    ? ["اسم المنشأة أو العميل", "رقم الجوال", "مدينة التسليم", "المواد المطلوبة أو ملف BOQ"]
    : ["Company or client name", "Mobile number", "Delivery city", "Required materials or BOQ file"];

  const clients = [
    { label: "Gmail", href: gmailHref, external: true },
    { label: "Outlook", href: outlookHref, external: true },
    { label: isRtl ? "بريد آخر" : "Other", href: otherHref, external: false },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SALES_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the address is still selectable/visible above
    }
  };

  return (
    <div className="grid overflow-hidden rounded-[1.75rem] border border-brand-dark/10 bg-white shadow-[0_1px_2px_rgba(29,63,31,0.04),0_16px_40px_-16px_rgba(29,63,31,0.18)] md:grid-cols-5">
      {/* left — context panel */}
      <div className="relative overflow-hidden bg-brand-dark px-8 py-10 text-white md:col-span-2 md:px-9 md:py-11">
        <div className="pointer-events-none absolute -end-16 -top-16 h-56 w-56 rounded-full bg-brand-primary/20 blur-3xl" />

        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
          <SendHorizontal className={`h-6 w-6 text-brand-accent ${isRtl ? "-scale-x-100" : ""}`} />
        </div>

        <h2 className="relative mt-6 text-xl font-bold md:text-2xl">
          {isRtl ? "أرسل طلبك إلى المبيعات" : "Email your request to sales"}
        </h2>
        <p className="relative mt-3 max-w-sm text-sm leading-7 text-white/65">
          {isRtl
            ? "اكتب تفاصيل مشروعك على البريد المقابل، وسيتواصل معك فريق المبيعات لإعداد عرض التوريد."
            : "Send your project details to the address on the right, and our sales team will follow up with a supply quote."}
        </p>

        <p className="relative mt-8 text-xs font-semibold uppercase tracking-wide text-white/40">
          {isRtl ? "ماذا نحتاج منك؟" : "What to include"}
        </p>
        <ul className="relative mt-3 space-y-2.5">
          {checklist.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-white/80">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="relative mt-8 flex items-center gap-2 border-t border-white/10 pt-5 text-xs font-medium text-white/50">
          <Clock className="h-3.5 w-3.5" />
          {isRtl ? "نرد عادة خلال يوم عمل واحد" : "We typically reply within one business day"}
        </div>
      </div>

      {/* right — action panel */}
      <div className="px-8 py-10 md:col-span-3 md:px-9 md:py-11">
        <p className="text-xs font-semibold text-brand-dark/50">
          {isRtl ? "البريد الإلكتروني" : "Email address"}
        </p>

        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary/[0.06] px-5 py-4">
          <a
            href={otherHref}
            className="truncate text-lg font-bold tracking-wide text-brand-primary hover:underline"
            dir="ltr"
          >
            {SALES_EMAIL}
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-primary/25 bg-white px-3.5 py-2 text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-primary/10"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? (isRtl ? "تم النسخ" : "Copied") : isRtl ? "نسخ" : "Copy"}
          </button>
        </div>

        <p className="mt-6 text-xs font-semibold text-brand-dark/50">
          {isRtl ? "أو افتح مباشرة عبر" : "Or open directly with"}
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          {clients.map((client, i) => (
            <a
              key={client.label}
              href={client.href}
              target={client.external ? "_blank" : undefined}
              rel={client.external ? "noopener noreferrer" : undefined}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition-colors min-w-[7.5rem] ${
                i === 0
                  ? "bg-brand-primary text-white hover:bg-brand-dark"
                  : "border border-brand-dark/15 bg-white text-brand-dark hover:bg-brand-dark/[0.04]"
              }`}
            >
              <Mail className="h-4 w-4" />
              {client.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

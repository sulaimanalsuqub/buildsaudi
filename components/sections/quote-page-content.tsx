import { ClipboardList, Mail, MessageSquare } from "lucide-react";

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
          ? "أرسل تفاصيل مشروعك وجدول الكميات إلى فريق المبيعات، وسنعود إليك في أقرب وقت."
          : "Send your project details and bill of quantities to our sales team, and we will get back to you shortly.",
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

  const mailto = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="rounded-2xl border border-brand-dark/10 bg-white p-8 shadow-sm md:p-10">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
        <Mail className="h-7 w-7" />
      </div>

      <h2 className="mt-6 text-xl font-bold text-brand-dark md:text-2xl">
        {isRtl ? "أرسل طلبك إلى المبيعات" : "Email your request to sales"}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-7 text-brand-dark/65">
        {isRtl
          ? "اكتب تفاصيل المشروع والمواد المطلوبة (أو أرفق جدول الكميات) على البريد التالي."
          : "Send your project details and required materials (or attach a BOQ) to the address below."}
      </p>

      <div className="mt-8 rounded-xl border border-brand-primary/20 bg-brand-primary/[0.06] px-5 py-4">
        <p className="text-xs font-semibold text-brand-dark/50">
          {isRtl ? "البريد الإلكتروني" : "Email address"}
        </p>
        <a
          href={mailto}
          className="mt-1 inline-block text-lg font-bold tracking-wide text-brand-primary hover:underline"
          dir="ltr"
        >
          {SALES_EMAIL}
        </a>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          href={mailto}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          <MessageSquare className="h-4 w-4" />
          {isRtl ? "فتح البريد وإرسال الطلب" : "Open email and send request"}
        </a>
        <a
          href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SALES_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-dark/15 bg-white px-7 py-3.5 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark/[0.04]"
        >
          {isRtl ? "فتح عبر Gmail" : "Open in Gmail"}
        </a>
      </div>
    </div>
  );
}

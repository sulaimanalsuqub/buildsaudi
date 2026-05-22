import { CalendarClock, ClipboardList, FileSpreadsheet, ShieldCheck, Truck } from "lucide-react";

import { GetQuoteForm } from "@/components/forms/get-quote-form";
import { Container } from "@/components/ui/container";

type QuotePageContentProps = {
  isRtl?: boolean;
};

const highlights = [
  {
    icon: FileSpreadsheet,
    en: "BOQ or material list",
    ar: "ملف BOQ أو قائمة مواد",
  },
  {
    icon: CalendarClock,
    en: "Target delivery date",
    ar: "تاريخ التسليم المطلوب",
  },
  {
    icon: Truck,
    en: "Site delivery details",
    ar: "تفاصيل التسليم للموقع",
  },
];

export function QuotePageContent({ isRtl = false }: QuotePageContentProps) {
  const t = {
    badge: isRtl ? "طلب منتجات" : "Product Request",
    title: isRtl ? "أرسل احتياج مشروعك بوضوح" : "Send a Clear Project Request",
    body: isRtl
      ? "كلما كانت البيانات أوضح، أصبحت مطابقة الموردين وتسعير المواد والشحن أسرع."
      : "Clear request details help the team match suppliers, price materials, and handle delivery faster.",
    sideTitle: isRtl ? "ما الذي نحتاجه؟" : "What we need",
    sideBody: isRtl
      ? "معلومات العميل، تفاصيل المواد، موقع التسليم، والموعد المطلوب."
      : "Client details, material needs, delivery location, and target timing.",
    trust: isRtl ? "تتم مراجعة الطلب من فريق بيلد" : "Reviewed by the Build team",
  };

  return (
    <main className="section-pad" dir={isRtl ? "rtl" : "ltr"}>
      <Container className="space-y-8 md:space-y-10">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <aside className="lg:sticky lg:top-28">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-white px-3 py-1.5 text-sm font-bold text-brand-primary shadow-soft">
              <ClipboardList className="h-4 w-4" />
              {t.badge}
            </p>
            <h1 className="type-section-title mt-5 text-brand-dark">{t.title}</h1>
            <p className="type-body mt-4 text-brand-dark/66">{t.body}</p>

            <div className="mt-6 rounded-2xl border border-brand-dark/10 bg-white p-5 shadow-soft">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-brand-dark">{t.sideTitle}</h2>
                  <p className="mt-1 text-sm leading-7 text-brand-dark/62">{t.sideBody}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.en} className="flex items-center gap-3 rounded-xl bg-brand-light/70 p-3">
                      <Icon className="h-4 w-4 text-brand-primary" />
                      <span className="text-sm font-semibold text-brand-dark/72">{isRtl ? item.ar : item.en}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="rounded-2xl border border-brand-dark/10 bg-white p-5 shadow-premium md:p-8">
            <div className="mb-6 border-b border-brand-dark/10 pb-5">
              <p className="inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-dark/70">
                <ShieldCheck className="h-4 w-4 text-brand-primary" />
                {t.trust}
              </p>
            </div>
            <GetQuoteForm isRtl={isRtl} />
          </section>
        </section>
      </Container>
    </main>
  );
}

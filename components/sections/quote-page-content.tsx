import { CalendarClock, ClipboardList, FileSpreadsheet, ShieldCheck, Truck } from "lucide-react";

import { GetQuoteForm } from "@/components/forms/get-quote-form";
import { Container } from "@/components/ui/container";

type QuotePageContentProps = {
  isRtl?: boolean;
};

export function QuotePageContent({ isRtl = false }: QuotePageContentProps) {
  const t = {
    badge: isRtl ? "أطلب المنتجات" : "Order Products",
    title: isRtl ? "أرسل احتياج مشروعك" : "Send Your Project Request",
    body: isRtl
      ? "أدخل المواد المطلوبة، موقع التسليم، والموعد المستهدف. يمكنك إضافة ملف BOQ لتسريع المراجعة."
      : "Enter the required materials, delivery location, and target date. You can attach a BOQ to speed up review.",
    sideTitle: isRtl ? "ما تحتاج تجهّزه" : "What to prepare",
  };

  const points = [
    {
      icon: FileSpreadsheet,
      text: isRtl ? "ملف الكميات أو قائمة المواد" : "BOQ or material list",
    },
    {
      icon: CalendarClock,
      text: isRtl ? "موعد التسليم المطلوب" : "Target delivery date",
    },
    {
      icon: Truck,
      text: isRtl ? "تفاصيل التسليم للموقع" : "Site delivery details",
    },
    {
      icon: ShieldCheck,
      text: isRtl ? "تتم المراجعة يدويًا" : "Manually reviewed",
    },
  ];

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>

      {/* Page hero */}
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

      {/* Form section */}
      <section className="bg-[#f7f9f6] py-10 md:py-14">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">

            <aside className="rounded-2xl border border-brand-dark/8 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">{t.sideTitle}</p>
              <div className="mt-4 space-y-3">
                {points.map((point) => {
                  const Icon = point.icon;
                  return (
                    <div key={point.text} className="flex items-center gap-3 rounded-xl bg-brand-light p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-brand-dark/72">{point.text}</span>
                    </div>
                  );
                })}
              </div>
            </aside>

            <section>
              <GetQuoteForm isRtl={isRtl} />
            </section>

          </div>
        </Container>
      </section>

    </main>
  );
}

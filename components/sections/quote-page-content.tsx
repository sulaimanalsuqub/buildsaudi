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
    <main className="section-pad" dir={isRtl ? "rtl" : "ltr"}>
      <Container className="space-y-6 md:space-y-8">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-primary/15 bg-white px-3 py-1.5 text-sm font-semibold text-brand-primary shadow-soft">
            <ClipboardList className="h-4 w-4" />
            {t.badge}
          </p>
          <h1 className="type-section-title mt-5 text-brand-dark">{t.title}</h1>
          <p className="type-subheading mt-4 text-brand-dark/68">{t.body}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-xl border border-brand-dark/10 bg-white p-5 shadow-soft">
            <div className="space-y-3">
              {points.map((point) => {
                const Icon = point.icon;
                return (
                  <div key={point.text} className="flex items-center gap-3 rounded-lg bg-brand-light/60 p-3">
                    <Icon className="h-4 w-4 shrink-0 text-brand-primary" />
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
    </main>
  );
}

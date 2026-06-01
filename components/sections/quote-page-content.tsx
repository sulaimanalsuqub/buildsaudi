import { ClipboardList } from "lucide-react";

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
          <div className="mx-auto max-w-4xl">
            <GetQuoteForm isRtl={isRtl} />
          </div>
        </Container>
      </section>

    </main>
  );
}

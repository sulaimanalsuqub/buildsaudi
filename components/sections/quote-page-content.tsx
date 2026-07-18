import { ClipboardList } from "lucide-react";

import { Container } from "@/components/ui/container";
import { ProcurementRequestForm } from "@/components/forms/procurement-request-form";

type QuotePageContentProps = {
  isRtl?: boolean;
};

export function QuotePageContent({ isRtl = false }: QuotePageContentProps) {
  const t = {
    badge: isRtl ? "طلب عرض سعر" : "Request a Quote",
    title: isRtl ? "أطلب المنتجات اللي تحتاجها" : "Request the Materials You Need",
    body: isRtl
      ? "عبّي بيانات مشروعك وموقع التسليم، وسيتواصل معك فريقنا بعرض الأسعار."
      : "Share your project details and delivery location, and our team will follow up with pricing.",
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
          <ProcurementRequestForm isRtl={isRtl} />
        </Container>
      </section>
    </main>
  );
}

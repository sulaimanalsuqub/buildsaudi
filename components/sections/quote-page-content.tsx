import { Container } from "@/components/ui/container";
import { ProcurementRequestForm } from "@/components/forms/procurement-request-form";

type QuotePageContentProps = {
  isRtl?: boolean;
};

export function QuotePageContent({ isRtl = false }: QuotePageContentProps) {
  const t = {
    title: isRtl ? "أرسل لنا قائمة المواد واحصل على عرض سعر" : "Send your materials list and get a quote",
    body: isRtl
      ? "اسقط ملف جدول الكميات أو قائمة المواد — يكفي لإعداد عرض السعر."
      : "Drop your BOQ or material list — that's all we need to prepare your quote.",
  };

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-white py-14 md:py-20">
      <Container>
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-8 space-y-3">
            <h1 className="text-[28px] font-bold leading-tight text-brand-dark md:text-[32px]">{t.title}</h1>
            <p className="text-[15px] leading-6 text-brand-dark/60">{t.body}</p>
          </div>
          <ProcurementRequestForm isRtl={isRtl} />
        </div>
      </Container>
    </main>
  );
}

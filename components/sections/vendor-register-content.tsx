import { VendorRegistrationForm } from "@/components/forms/vendor-registration-form";
import { Container } from "@/components/ui/container";

type VendorRegisterContentProps = {
  isRtl?: boolean;
};

export function VendorRegisterContent({ isRtl = false }: VendorRegisterContentProps) {
  const t = {
    badge: isRtl ? "تسجيل الموردين" : "Supplier Registration",
    title: isRtl ? "سجّل منشأتك كمورد" : "Register your company as a supplier",
    body: isRtl
      ? "أدخل بيانات منشأتك الأساسية فقط، ثم أكمل نموذج التأهيل."
      : "Enter your company basics, then complete the qualification form.",
    note: isRtl ? "مخصص للموردين فقط" : "For suppliers only",
  };

  return (
    <main className="section-pad" dir={isRtl ? "rtl" : "ltr"}>
      <Container className="space-y-6 md:space-y-8">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-white px-3 py-1.5 text-sm font-semibold text-brand-primary shadow-soft">
            {t.badge}
          </p>
          <h1 className="type-section-title mt-5 text-brand-dark">{t.title}</h1>
          <p className="type-subheading mt-4 text-brand-dark/68">{t.body}</p>
          <p className="mt-4 text-sm font-semibold text-brand-dark/55">{t.note}</p>
        </div>

        <div id="supplier-registration-form" className="scroll-mt-28">
          <VendorRegistrationForm isRtl={isRtl} />
        </div>
      </Container>
    </main>
  );
}

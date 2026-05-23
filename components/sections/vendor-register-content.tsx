import { VendorRegistrationForm } from "@/components/forms/vendor-registration-form";
import { Container } from "@/components/ui/container";

type VendorRegisterContentProps = {
  isRtl?: boolean;
};

export function VendorRegisterContent({ isRtl = false }: VendorRegisterContentProps) {
  const t = {
    badge: isRtl ? "تسجيل الموردين" : "Supplier Registration",
    title: isRtl ? "سجّل منشأتك كمورد" : "Register your company as a supplier",
  };

  return (
    <main className="section-pad" dir={isRtl ? "rtl" : "ltr"}>
      <Container className="space-y-6 md:space-y-8">
        <section className="overflow-hidden rounded-xl border border-brand-dark/10 bg-white shadow-soft">
          <div className="p-6 md:p-8">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-primary/15 bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-primary">
                {t.badge}
              </p>
              <h1 className="type-section-title mt-5 text-brand-dark">{t.title}</h1>
            </div>
          </div>
        </section>

        <div id="supplier-registration-form" className="scroll-mt-28">
          <VendorRegistrationForm isRtl={isRtl} />
        </div>
      </Container>
    </main>
  );
}

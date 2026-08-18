import { VendorRegistrationForm } from "@/components/forms/vendor-registration-form";
import { Container } from "@/components/ui/container";

type VendorRegisterContentProps = {
  isRtl?: boolean;
};

export function VendorRegisterContent({ isRtl = false }: VendorRegisterContentProps) {
  const t = {
    title: isRtl ? "سجّل منشأتك كمورد" : "Register your company as a supplier",
    body: isRtl
      ? "المرحلة الأولى: أرسل بيانات منشأتك الأساسية وفئات منتجاتك. بعد مراجعة بيلد والموافقة، يصلكم رابط آمن لإكمال ملف التوريد الكامل."
      : "Phase 1: submit your basic company details and product categories. After Build reviews and approves, you'll receive a secure link to complete your full supply profile.",
  };

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>

      {/* Page hero */}
      <section className="bg-white py-12 md:py-16">
        <Container>
          <div className="max-w-2xl border-t border-brand-dark/10 pt-6">
            <h1 className="type-hero text-brand-dark">{t.title}</h1>
            <p className="type-subheading mt-4 max-w-lg text-brand-dark/62">{t.body}</p>
          </div>
        </Container>
      </section>

      {/* Form section */}
      <section className="bg-[#f7f9f6] py-10 md:py-14">
        <Container>
          <div id="supplier-registration-form" className="scroll-mt-28">
            <VendorRegistrationForm isRtl={isRtl} />
          </div>
        </Container>
      </section>

    </main>
  );
}

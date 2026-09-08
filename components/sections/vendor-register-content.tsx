import { VendorRegistrationForm } from "@/components/forms/vendor-registration-form";
import { Container } from "@/components/ui/container";

export function VendorRegisterContent({ isRtl = false }: { isRtl?: boolean }) {
  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-brand-light pb-16">
      <Container>
        <header className="pb-8 pt-10 md:pb-10 md:pt-14">
          <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-brand-dark/60"><span className="h-2 w-2 bg-brand-primary" aria-hidden="true" />{isRtl ? "شبكة موردي بيلد" : "Build supplier network"}</p>
          <h1 className="type-hero text-brand-dark">{isRtl ? "منتجاتك، لمشاريع أكثر." : "Your products. More projects."}</h1>
          <p className="type-body mt-3 max-w-2xl text-brand-dark/65">{isRtl ? "عرّفنا بمنشأتك والمنتجات التي تورّدها. نراجع طلب الانضمام ونتواصل معك لاستكمال الخطوات." : "Tell us about your company and the products you supply. We’ll review your application and contact you about the next steps."}</p>
        </header>
        <div id="supplier-registration-form" className="scroll-mt-28"><VendorRegistrationForm isRtl={isRtl} /></div>
      </Container>
    </main>
  );
}

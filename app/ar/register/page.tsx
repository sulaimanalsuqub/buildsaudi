import { Metadata } from "next";

import { VendorRegistrationForm } from "@/components/forms/vendor-registration-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "ابدأ التوريد"
};

export default function ArabicRegisterPage() {
  return (
    <main className="section-pad" dir="rtl">
      <Container className="content-stack">
        <div className="mx-auto max-w-[900px] text-center">
          <h1 className="type-section-title mx-auto text-brand-dark">انضم لقائمة الموردين</h1>
          <p className="type-subheading mx-auto mt-6 text-brand-dark/80">سجّل شركتك كمورد معتمد في Build</p>
        </div>
        <VendorRegistrationForm isRtl />
      </Container>
    </main>
  );
}

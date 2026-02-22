import { Metadata } from "next";

import { VendorRegistrationForm } from "@/components/forms/vendor-registration-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "ابدأ التوريد"
};

export default function ArabicRegisterPage() {
  return (
    <main className="py-16" dir="rtl">
      <Container>
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h1 className="type-section-title text-brand-dark">انضم لقائمة الموردين</h1>
          <p className="type-subheading mt-4 text-brand-dark/75">
            سجّل شركتك كمورد معتمد في Build
          </p>
        </div>
        <VendorRegistrationForm isRtl />
      </Container>
    </main>
  );
}

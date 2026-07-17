import { Truck } from "lucide-react";

import { CarrierRegistrationForm } from "@/components/forms/carrier-registration-form";
import { Container } from "@/components/ui/container";

type CarrierRegisterContentProps = {
  isRtl?: boolean;
};

export function CarrierRegisterContent({ isRtl = false }: CarrierRegisterContentProps) {
  const t = {
    badge: isRtl ? "تسجيل الناقلين" : "Carrier Registration",
    title: isRtl ? "سجّل منشأتك كناقل" : "Register your company as a carrier",
    body: isRtl
      ? "المرحلة الأولى: أرسل بيانات منشأتك الأساسية ومناطق خدمتك وأسطولك. بعد مراجعة بيلد والموافقة، يصلكم رابط آمن لإكمال ملف الناقل الكامل."
      : "Phase 1: submit your basic company details, service areas, and fleet. After Build reviews and approves, you'll receive a secure link to complete your full carrier profile.",
  };

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>
      <section className="bg-white py-12 md:py-16">
        <Container>
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-brand-primary/8 px-4 py-1.5 text-sm font-semibold text-brand-primary">
              <Truck className="h-4 w-4" />
              {t.badge}
            </span>
            <h1 className="type-hero mt-5 text-brand-dark">{t.title}</h1>
            <p className="type-subheading mt-4 max-w-lg text-brand-dark/62">{t.body}</p>
          </div>
        </Container>
      </section>

      <section className="bg-[#f7f9f6] py-10 md:py-14">
        <Container>
          <div id="carrier-registration-form" className="scroll-mt-28">
            <CarrierRegistrationForm isRtl={isRtl} />
          </div>
        </Container>
      </section>
    </main>
  );
}

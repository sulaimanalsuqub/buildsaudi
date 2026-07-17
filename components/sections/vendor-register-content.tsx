import Image from "next/image";
import { Store } from "lucide-react";

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
      ? "المرحلة الأولى: أرسل بيانات منشأتك الأساسية وفئات منتجاتك. بعد مراجعة بيلد والموافقة، يصلكم رابط آمن لإكمال ملف التوريد الكامل."
      : "Phase 1: submit your basic company details and product categories. After Build reviews and approves, you'll receive a secure link to complete your full supply profile.",
  };

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>

      {/* Page hero */}
      <section className="bg-white py-12 md:py-16">
        <Container>
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-brand-primary/8 px-4 py-1.5 text-sm font-semibold text-brand-primary">
                <Store className="h-4 w-4" />
                {t.badge}
              </span>
              <h1 className="type-hero mt-5 text-brand-dark">{t.title}</h1>
              <p className="type-subheading mt-4 max-w-lg text-brand-dark/62">{t.body}</p>
            </div>
            <div>
              <Image
                src="/images/build-truck-vendor.png"
                alt={isRtl ? "شاحنة بيلد للتوريد" : "Build supply truck"}
                width={600}
                height={400}
                className="w-full object-contain"
                priority
              />
            </div>
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

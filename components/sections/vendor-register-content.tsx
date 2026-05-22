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
        <section className="overflow-hidden rounded-3xl border border-brand-dark/10 bg-white shadow-soft">
          <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-primary/15 bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand-primary">
                {t.badge}
              </p>
              <h1 className="type-section-title mt-5 text-brand-dark">{t.title}</h1>
              <p className="type-subheading mt-4 text-brand-dark/68">{t.body}</p>
              <p className="mt-4 text-sm font-semibold text-brand-dark/55">{t.note}</p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-brand-dark/10 bg-brand-light/60 p-4">
              <MiniStat value="3 min" label={isRtl ? "وقت التسجيل" : "Registration time"} />
              <MiniStat value="RFQ" label={isRtl ? "طلبات مناسبة" : "Qualified RFQs"} />
              <MiniStat value="KSA" label={isRtl ? "تغطية داخل المملكة" : "Coverage in Saudi Arabia"} />
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

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
      <span className="text-lg font-black text-brand-dark">{value}</span>
      <span className="text-sm font-semibold text-brand-dark/55">{label}</span>
    </div>
  );
}

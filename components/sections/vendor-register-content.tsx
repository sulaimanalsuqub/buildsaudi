import { Mail, Wrench } from "lucide-react";
import { Container } from "@/components/ui/container";

type VendorRegisterContentProps = {
  isRtl?: boolean;
};

export function VendorRegisterContent({ isRtl = false }: VendorRegisterContentProps) {
  const t = {
    badge: isRtl ? "تسجيل الموردين" : "Supplier registration",
    title: isRtl ? "سنعود بتجربة أسرع" : "We’ll be back with a faster experience",
    body: isRtl
      ? "نعمل حاليًا على تحسين تجربة تسجيل الموردين في بيلد. نعتذر عن الإيقاف المؤقت، ونشكركم على تفهمكم."
      : "We’re currently improving Build’s supplier registration experience. Registration is temporarily paused while we make it faster and easier.",
    contact: isRtl ? "للاستفسارات والتواصل معنا" : "For questions, contact us",
  };

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>
      <section className="flex min-h-[calc(100svh-72px)] items-center bg-[#f7f9f6] py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
              <Wrench className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="mt-8 text-sm font-bold tracking-[0.16em] text-brand-primary">✦ BUILD</p>
            <p className="mt-3 text-sm font-semibold text-brand-dark/55">{t.badge}</p>
            <h1 className="type-hero mt-5 text-brand-dark">{t.title}</h1>
            <p className="type-subheading mx-auto mt-6 max-w-xl text-brand-dark/65">{t.body}</p>
            <div className="mx-auto mt-10 inline-flex max-w-full items-center gap-3 rounded-full border border-brand-dark/10 bg-white px-5 py-3 text-sm font-semibold text-brand-dark shadow-soft" dir="ltr">
              <Mail className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
              <span className="sr-only">{t.contact}: </span>
              <a href="mailto:supplier@build.sa" className="hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30">
                supplier@build.sa
              </a>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

import { Mail, Wrench } from "lucide-react";
import { Container } from "@/components/ui/container";

type Props = { isRtl?: boolean };

// Carrier onboarding is done by the Build team directly from the Build-OPT dashboard, not through
// public self-registration (owner decision, 2026-09-07) - this replaces the self-service form
// rather than leaving it live and unused/misleading.
export function CarrierRegisterPausedContent({ isRtl = false }: Props) {
  const t = {
    badge: isRtl ? "تسجيل الناقلين" : "Carrier registration",
    title: isRtl ? "التسجيل مغلق مؤقتاً" : "Registration is currently closed",
    body: isRtl
      ? "تسجيل الناقلين حالياً يتم مباشرة عبر فريق بيلد. إذا كنت تمثل شركة نقل وتود الانضمام كشريك، تواصل معنا وسنكمل التسجيل من طرفنا."
      : "Carrier onboarding is currently handled directly by the Build team. If you represent a carrier and would like to partner with us, contact us and we'll complete your registration.",
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
            <div
              className="mx-auto mt-10 inline-flex max-w-full items-center gap-3 rounded-full border border-brand-dark/10 bg-white px-5 py-3 text-sm font-semibold text-brand-dark shadow-soft"
              dir="ltr"
            >
              <Mail className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden="true" />
              <span className="sr-only">{t.contact}: </span>
              <a
                href="mailto:logistics@build.sa"
                className="hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
              >
                logistics@build.sa
              </a>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

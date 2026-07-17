"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, Truck } from "lucide-react";

import { CarrierCompleteProfileForm } from "@/components/forms/carrier-complete-profile-form";
import { Container } from "@/components/ui/container";
import { textByLang } from "@/lib/vendor-options";

type OnboardingData = {
  ok: true;
  profile_id: number;
  establishment_name: string;
  carrier_type: "local" | "international";
  country: string;
  short_description: string;
  status: string;
  read_only: boolean;
  draft: Record<string, unknown> | null;
};

type CarrierCompleteContentProps = {
  isRtl?: boolean;
};

export function CarrierCompleteContent({ isRtl = false }: CarrierCompleteContentProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OnboardingData | null>(null);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(textByLang(isRtl, "Invitation link is missing or invalid.", "رابط الدعوة غير موجود أو غير صالح."));
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/carriers/onboarding?token=${encodeURIComponent(token)}`);
        const body = (await res.json().catch(() => null)) as OnboardingData | { error?: string } | null;

        if (cancelled) return;

        if (!res.ok || !body || !("ok" in body) || !body.ok) {
          setError(
            body && "error" in body && body.error
              ? body.error
              : textByLang(isRtl, "Could not validate your invitation.", "تعذر التحقق من رابط الدعوة.")
          );
          return;
        }

        if (body.read_only) {
          setCompleted(true);
          return;
        }

        setData(body);
      } catch {
        if (!cancelled) {
          setError(textByLang(isRtl, "Connection error. Please try again.", "خطأ في الاتصال. حاول مرة أخرى."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, isRtl]);

  const t = {
    badge: textByLang(isRtl, "Complete Carrier Profile", "إكمال ملف الناقل"),
    title: textByLang(isRtl, "Your carrier journey starts here", "رحلة انضمامكم كناقل بدأت"),
    body: textByLang(
      isRtl,
      "You were approved as a Build carrier. Complete your profile to receive matching shipment requests.",
      "تمت الموافقة على انضمامكم كناقل في بيلد. أكملوا ملف الناقل لاستقبال طلبات الشحن المناسبة."
    ),
    completedTitle: textByLang(isRtl, "Profile Already Completed", "تم إكمال الملف مسبقاً"),
    completedBody: textByLang(
      isRtl,
      "Your carrier profile is already on file. Build will contact you when matching shipment opportunities are available.",
      "ملف الناقل مكتمل لدينا. سيتواصل معكم فريق بيلد عند توفر طلبات شحن مناسبة."
    ),
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
          {loading ? (
            <div className="mx-auto flex max-w-5xl items-center justify-center gap-3 rounded-2xl border border-brand-dark/10 bg-white p-12 text-brand-dark/70">
              <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
              <span>{textByLang(isRtl, "Validating invitation…", "جاري التحقق من رابط الدعوة…")}</span>
            </div>
          ) : completed ? (
            <div className="mx-auto max-w-5xl rounded-2xl border border-brand-primary/20 bg-white p-8 text-center">
              <Truck className="mx-auto h-12 w-12 text-brand-primary" />
              <h2 className="mt-4 text-2xl font-bold text-brand-dark">{t.completedTitle}</h2>
              <p className="mt-3 text-brand-dark/75">{t.completedBody}</p>
            </div>
          ) : error ? (
            <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-white p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-4 text-xl font-bold text-brand-dark">
                {textByLang(isRtl, "Invalid Invitation", "رابط غير صالح")}
              </h2>
              <p className="mt-3 text-brand-dark/75">{error}</p>
            </div>
          ) : data ? (
            <CarrierCompleteProfileForm
              isRtl={isRtl}
              onboardingToken={token}
              establishmentName={data.establishment_name}
              carrierType={data.carrier_type}
              initialDraft={data.draft}
            />
          ) : null}
        </Container>
      </section>
    </main>
  );
}

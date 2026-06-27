"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, PackageCheck } from "lucide-react";

import { VendorCompleteProfileForm } from "@/components/forms/vendor-complete-profile-form";
import { Container } from "@/components/ui/container";
import { textByLang } from "@/lib/vendor-options";

type OnboardingData = {
  ok: true;
  supplier_id: string;
  establishment_name: string;
  manager_name: string;
  email: string;
  is_saudi?: boolean;
};

type VendorCompleteContentProps = {
  isRtl?: boolean;
};

export function VendorCompleteContent({ isRtl = false }: VendorCompleteContentProps) {
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
        const res = await fetch(`/api/vendors/onboarding?token=${encodeURIComponent(token)}`);
        const body = (await res.json().catch(() => null)) as
          | OnboardingData
          | { error?: string; completed?: boolean }
          | null;

        if (cancelled) return;

        if (res.status === 409 && body && "completed" in body && body.completed) {
          setCompleted(true);
          return;
        }

        if (!res.ok || !body || !("ok" in body) || !body.ok) {
          setError(
            body && "error" in body && body.error
              ? body.error
              : textByLang(isRtl, "Could not validate your invitation.", "تعذر التحقق من رابط الدعوة.")
          );
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
    badge: textByLang(isRtl, "Complete Supply Profile", "إكمال ملف التوريد"),
    title: textByLang(isRtl, "Your supply journey starts here", "رحلة توريد منتجاتك بدأت"),
    body: textByLang(
      isRtl,
      "You were approved as a Build supplier. Verify your email and complete your profile to receive matching RFQ opportunities.",
      "تمت الموافقة على انضمامكم كمورد في بيلد. تحققوا من بريدكم ثم أكملوا ملف التوريد لاستقبال فرص التوريد المناسبة."
    ),
    completedTitle: textByLang(isRtl, "Profile Already Completed", "تم إكمال الملف مسبقاً"),
    completedBody: textByLang(
      isRtl,
      "Your supply profile is already on file. Build will contact you when matching opportunities are available.",
      "ملف التوريد مكتمل لدينا. سيتواصل معكم فريق بيلد عند توفر فرص مناسبة."
    ),
  };

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>
      <section className="bg-white py-12 md:py-16">
        <Container>
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-brand-primary/8 px-4 py-1.5 text-sm font-semibold text-brand-primary">
                <PackageCheck className="h-4 w-4" />
                {t.badge}
              </span>
              <h1 className="type-hero mt-5 text-brand-dark">{t.title}</h1>
              <p className="type-subheading mt-4 max-w-lg text-brand-dark/62">{t.body}</p>
            </div>
            <div>
              <Image
                src="/images/build-truck-vendor.png"
                alt={textByLang(isRtl, "Build supply truck", "شاحنة بيلد للتوريد")}
                width={600}
                height={400}
                className="w-full object-contain"
                priority
              />
            </div>
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
              <PackageCheck className="mx-auto h-12 w-12 text-brand-primary" />
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
            <VendorCompleteProfileForm
              isRtl={isRtl}
              onboardingToken={token}
              establishmentName={data.establishment_name}
              email={data.email}
              isSaudi={data.is_saudi !== false}
            />
          ) : null}
        </Container>
      </section>
    </main>
  );
}
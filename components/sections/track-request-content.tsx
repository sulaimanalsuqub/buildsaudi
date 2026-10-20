"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, PackageSearch, Search } from "lucide-react";

import { Container } from "@/components/ui/container";
import { textByLang } from "@/lib/vendor-options";

type TrackingData = {
  trackingNumber: string;
  projectName: string;
  customerStatus: string;
  requestDate: string;
  declineReason: string | null;
};

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  received: { ar: "تم استلام الطلب", en: "Request received" },
  reviewing: { ar: "جارٍ مراجعة المتطلبات", en: "Reviewing requirements" },
  need_info: { ar: "نحتاج معلومات إضافية", en: "We need more information" },
  pricing: { ar: "جارٍ الحصول على الأسعار", en: "Getting pricing" },
  quote_preparing: { ar: "عرض السعر قيد الإعداد", en: "Preparing your quote" },
  quote_ready: { ar: "عرض السعر جاهز", en: "Quote ready" },
  confirmed: { ar: "تم تأكيد الطلب", en: "Order confirmed" },
  preparing: { ar: "المواد قيد التجهيز", en: "Materials being prepared" },
  ready_to_ship: { ar: "جاهز للشحن", en: "Ready to ship" },
  in_transit: { ar: "الشحنة في الطريق", en: "In transit" },
  arrived: { ar: "وصلت إلى الموقع", en: "Arrived on site" },
  delivered: { ar: "تم التسليم", en: "Delivered" },
  needs_attention: { ar: "يوجد تحديث يحتاج انتباهك", en: "Update needs your attention" },
  completed: { ar: "مكتمل", en: "Completed" },
  declined: { ar: "تعذّر تسعير الطلب", en: "We couldn't price this request" },
};

const DECLINE_REASON_LABELS: Record<string, { ar: string; en: string }> = {
  items_unavailable: { ar: "الأصناف المطلوبة غير متوفرة لدى مورّدينا حالياً", en: "The requested items aren't currently available from our suppliers" },
  high_demand: { ar: "ضغط كبير على الطلبات حالياً يمنعنا من تسعير طلبكم في الوقت المناسب", en: "High order volume is preventing us from pricing your request in time" },
  outside_coverage: { ar: "موقع التسليم خارج نطاق تغطيتنا الحالي", en: "The delivery location is outside our current coverage area" },
  unclear_scope: { ar: "الطلب يحتاج تفاصيل إضافية لم نتمكن من استلامها", en: "The request needs additional details we weren't able to obtain" },
  other: { ar: "لأسباب تشغيلية لدينا", en: "Due to operational reasons on our side" },
};

export function TrackRequestContent({ isRtl = false }: { isRtl?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(Boolean(token));
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!token) {
      // لا رمز في الرابط — نعرض خانة الإدخال بدل رسالة خطأ
      setLoading(false);
      setData(null);
      setError("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const res = await fetch(`/api/quotes/track?token=${encodeURIComponent(token)}`);
        const body = (await res.json().catch(() => null)) as (TrackingData & { ok: true }) | { error?: string } | null;
        if (cancelled) return;
        if (!res.ok || !body || !("ok" in body)) {
          setError(body && "error" in body && body.error ? body.error : textByLang(isRtl, "Could not find this request.", "تعذر العثور على هذا الطلب."));
          return;
        }
        setData(body);
      } catch {
        if (!cancelled) setError(textByLang(isRtl, "Connection error. Please try again.", "خطأ في الاتصال. حاول مرة أخرى."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, isRtl]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    const base = isRtl ? "/ar/track-request" : "/track-request";
    router.push(`${base}?token=${encodeURIComponent(value)}`);
  };

  const statusLabel = data ? STATUS_LABELS[data.customerStatus] : null;
  const isDeclined = data?.customerStatus === "declined";
  const reasonLabel = data?.declineReason ? DECLINE_REASON_LABELS[data.declineReason] : null;

  const showSearch = !loading && !data;

  return (
    <main dir={isRtl ? "rtl" : "ltr"}>
      <section className="flex min-h-[calc(100svh-72px)] items-center bg-[#f2f6f4] py-12 md:py-20" aria-labelledby="track-request-title">
        <Container>
          <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="max-w-xl">
              <h1 id="track-request-title" className="text-3xl font-bold leading-tight tracking-tight text-brand-dark sm:text-4xl md:text-5xl">
                {textByLang(isRtl, "Track your request", "تتبّع طلبك")}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-8 text-brand-dark/75 md:text-lg">
                {textByLang(isRtl, "Enter the reference number you received when you submitted your request.", "أدخل الرقم المرجعي الذي استلمته عند إرسال طلبك.")}
              </p>
            </div>

            <div className="rounded-[14px] border border-brand-dark/12 bg-white p-6 md:p-8">
              {loading ? (
                <div className="flex min-h-44 items-center justify-center gap-3 text-brand-dark/75" role="status" aria-live="polite">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-primary" aria-hidden="true" />
                  <span>{textByLang(isRtl, "Loading your request…", "جاري تحميل بيانات طلبكم…")}</span>
                </div>
              ) : data ? (
                <div aria-live="polite">
                  <div className="flex items-start gap-4 border-b border-brand-dark/10 pb-6">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#eaf2ee] text-brand-dark">
                      <PackageSearch className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-dark/70">{textByLang(isRtl, "Tracking number", "رقم التتبع")}</p>
                      <p className="mt-1 break-all text-lg font-bold tracking-wide text-brand-dark" dir="ltr">{data.trackingNumber}</p>
                      {data.projectName && <p className="mt-2 text-sm text-brand-dark/75">{data.projectName}</p>}
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-semibold text-brand-dark/70">{textByLang(isRtl, "Current status", "الحالة الحالية")}</p>
                    <p className={`mt-2 text-xl font-bold leading-relaxed ${isDeclined ? "text-red-700" : "text-brand-dark"}`}>
                      {statusLabel ? (isRtl ? statusLabel.ar : statusLabel.en) : data.customerStatus}
                    </p>
                    {isDeclined && reasonLabel && (
                      <p className="mt-2 text-sm leading-7 text-red-700/90">{isRtl ? reasonLabel.ar : reasonLabel.en}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setData(null); setError(""); setInput(""); router.push(isRtl ? "/ar/track-request" : "/track-request"); }}
                    className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-dark underline decoration-brand-dark/35 underline-offset-4 transition hover:decoration-brand-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary"
                  >
                    {textByLang(isRtl, "Track another request", "تتبّع طلبًا آخر")}
                  </button>
                </div>
              ) : showSearch ? (
                <form onSubmit={onSubmit}>
                  <label htmlFor="tracking-number" className="block text-sm font-semibold text-brand-dark">
                    {textByLang(isRtl, "Reference number", "الرقم المرجعي")}
                  </label>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      id="tracking-number"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={textByLang(isRtl, "e.g. MAT-MR-2026-00001", "مثال: MAT-MR-2026-00001")}
                      dir="ltr"
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? "tracking-error" : undefined}
                      className="min-h-12 min-w-0 flex-1 rounded-lg border border-brand-dark/20 bg-white px-4 text-center text-brand-dark outline-none transition placeholder:text-brand-dark/70 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                    />
                    <button
                      type="submit"
                      className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-dark px-6 font-bold text-white transition hover:bg-brand-dark/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary"
                    >
                      <Search className="h-4 w-4" aria-hidden="true" />
                      {textByLang(isRtl, "Track request", "تتبّع الطلب")}
                    </button>
                  </div>
                  {error && (
                    <p id="tracking-error" className="mt-4 flex items-start gap-2 text-sm leading-6 text-red-700" role="alert">
                      <AlertCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{error}</span>
                    </p>
                  )}
                </form>
              ) : null}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

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
      <section className="bg-[#f7f9f6] py-14 md:py-20">
        <Container>
          <div className="mx-auto max-w-xl rounded-2xl border border-brand-dark/10 bg-white p-8 text-center md:p-10">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-8 text-brand-dark/70">
                <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                <span>{textByLang(isRtl, "Loading your request…", "جاري تحميل بيانات طلبكم…")}</span>
              </div>
            ) : data ? (
              <>
                <PackageSearch className="mx-auto h-12 w-12 text-brand-primary" />
                <p className="mt-4 text-xs font-semibold text-brand-dark/50">{textByLang(isRtl, "Tracking Number", "رقم التتبع")}</p>
                <p className="text-lg font-bold tracking-wide text-brand-primary" dir="ltr">{data.trackingNumber}</p>
                {data.projectName && <p className="mt-4 text-sm text-brand-dark/60">{data.projectName}</p>}
                <div className={`mx-auto mt-6 max-w-sm rounded-xl px-5 py-4 ${isDeclined ? "bg-red-50" : "bg-brand-primary/8"}`}>
                  <p className="text-sm font-semibold text-brand-dark/50">{textByLang(isRtl, "Current Status", "الحالة الحالية")}</p>
                  <p className={`mt-1 text-lg font-bold ${isDeclined ? "text-red-700" : "text-brand-primary"}`}>
                    {statusLabel ? (isRtl ? statusLabel.ar : statusLabel.en) : data.customerStatus}
                  </p>
                  {isDeclined && reasonLabel && (
                    <p className="mt-2 text-sm text-red-600/90">{isRtl ? reasonLabel.ar : reasonLabel.en}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setData(null); setError(""); setInput(""); router.push(isRtl ? "/ar/track-request" : "/track-request"); }}
                  className="mt-6 text-sm text-brand-primary hover:underline"
                >
                  {textByLang(isRtl, "Track another request", "تتبّع طلب آخر")}
                </button>
              </>
            ) : null}

            {showSearch && (
              <>
                <PackageSearch className="mx-auto h-12 w-12 text-brand-primary" />
                <h2 className="mt-4 text-xl font-bold text-brand-dark">{textByLang(isRtl, "Track your request", "تتبّع طلبك")}</h2>
                <p className="mt-2 text-sm text-brand-dark/70">
                  {textByLang(isRtl, "Enter the reference number you received when you submitted your request.", "أدخل الرقم المرجعي الذي استلمته عند إرسال طلبك.")}
                </p>
                {error && (
                  <div className="mx-auto mt-4 flex items-center justify-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" /> <span>{error}</span>
                  </div>
                )}
                <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={textByLang(isRtl, "e.g. MAT-MR-2026-00001", "مثال: MAT-MR-2026-00001")}
                    dir="ltr"
                    className="min-h-11 flex-1 rounded-xl border border-brand-dark/15 px-4 text-center text-brand-dark outline-none focus:border-brand-primary"
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 font-bold text-white hover:bg-brand-primary/90"
                  >
                    <Search className="h-4 w-4" /> {textByLang(isRtl, "Track", "تتبّع")}
                  </button>
                </form>
              </>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, PackageSearch } from "lucide-react";

import { Container } from "@/components/ui/container";
import { textByLang } from "@/lib/vendor-options";

type TrackingData = {
  trackingNumber: string;
  projectName: string;
  customerStatus: string;
  requestDate: string;
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
};

export function TrackRequestContent({ isRtl = false }: { isRtl?: boolean }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError(textByLang(isRtl, "Tracking link is missing or invalid.", "رابط التتبع غير موجود أو غير صالح."));
      setLoading(false);
      return;
    }
    let cancelled = false;
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

  const statusLabel = data ? STATUS_LABELS[data.customerStatus] : null;

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
            ) : error ? (
              <>
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <h2 className="mt-4 text-xl font-bold text-brand-dark">{textByLang(isRtl, "Not Found", "غير موجود")}</h2>
                <p className="mt-3 text-brand-dark/75">{error}</p>
              </>
            ) : data ? (
              <>
                <PackageSearch className="mx-auto h-12 w-12 text-brand-primary" />
                <p className="mt-4 text-xs font-semibold text-brand-dark/50">{textByLang(isRtl, "Tracking Number", "رقم التتبع")}</p>
                <p className="text-lg font-bold tracking-wide text-brand-primary" dir="ltr">{data.trackingNumber}</p>
                {data.projectName && <p className="mt-4 text-sm text-brand-dark/60">{data.projectName}</p>}
                <div className="mx-auto mt-6 max-w-sm rounded-xl bg-brand-primary/8 px-5 py-4">
                  <p className="text-sm font-semibold text-brand-dark/50">{textByLang(isRtl, "Current Status", "الحالة الحالية")}</p>
                  <p className="mt-1 text-lg font-bold text-brand-primary">
                    {statusLabel ? (isRtl ? statusLabel.ar : statusLabel.en) : data.customerStatus}
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </Container>
      </section>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
const NEXT_STATUS: Record<string, { label: string; next: string }> = {
  new:                    { label: "اعتماد الطلب", next: "admin_approved" },
  admin_approved:         { label: "تأكيد إرسال RFQ", next: "rfq_sent" },
  rfq_sent:               { label: "استلام عروض الموردين", next: "vendor_quotes_received" },
  vendor_quotes_received: { label: "إرسال لوكيل الشحن", next: "freight_sent" },
  freight_sent:           { label: "استلام سعر الشحن", next: "freight_received" },
  freight_received:       { label: "إرسال العرض للعميل", next: "offer_sent" },
  offer_sent:             { label: "تسجيل موافقة العميل", next: "client_approved" },
  client_approved:        { label: "انتظار الدفع", next: "payment_pending" },
  payment_pending:        { label: "تأكيد استلام الدفع", next: "payment_confirmed" },
  payment_confirmed:      { label: "بدء التوصيل", next: "in_delivery" },
  in_delivery:            { label: "إتمام الطلب", next: "done" },
};

async function apiPost(path: string, body: object) {
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function QuoteActions({ id, currentStatus }: { id: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const advance = async () => {
    const action = NEXT_STATUS[currentStatus];
    if (!action) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiPost("/api/admin/update-quote-status", { quoteId: id, status: action.next });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "حدث خطأ");
        return;
      }
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  const cancel = async () => {
    if (!confirm("هل أنت متأكد من إلغاء هذا الطلب؟")) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiPost("/api/admin/update-quote-status", { quoteId: id, status: "cancelled" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "حدث خطأ");
        return;
      }
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  const deleteQuote = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟ لا يمكن التراجع.")) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiPost("/api/admin/delete-quote", { quoteId: id });
      if (res.ok) {
        router.push("/admin/quotes");
      } else {
        const data = await res.json();
        setError(data.error ?? "فشل الحذف");
        setLoading(false);
      }
    } catch {
      setError("حدث خطأ في الاتصال");
      setLoading(false);
    }
  };

  const action = NEXT_STATUS[currentStatus];

  const deleteBtn = (
    <button
      onClick={deleteQuote}
      disabled={loading}
      className="rounded-full border border-red-300 bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 transition-all hover:bg-red-200 disabled:opacity-60"
      title="حذف نهائي"
    >
      🗑
    </button>
  );

  if (currentStatus === "done") {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
            مكتمل ✓
          </span>
          {deleteBtn}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (currentStatus === "cancelled") {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600">
            ملغي
          </span>
          {deleteBtn}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1" dir="rtl">
      <div className="flex items-center gap-2">
        {action && (
          <button
            onClick={advance}
            disabled={loading}
            className="rounded-full bg-[#09B14B] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#1D3F1F] disabled:opacity-60"
          >
            {loading ? "..." : action.label}
          </button>
        )}
        <button
          onClick={cancel}
          disabled={loading}
          className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 disabled:opacity-60"
        >
          إلغاء
        </button>
        {deleteBtn}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

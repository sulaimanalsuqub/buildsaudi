"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Rfq = {
  id: string;
  vendor_id: string;
  status: string;
  vendors: { establishment_name: string; manager_name: string; email: string } | null;
};

type VendorQuote = {
  id: string;
  rfq_id: string;
  vendor_id: string;
  total_price: number;
  delivery_days: number | null;
  validity_days: number | null;
  notes: string | null;
};

type Props = {
  initialRfqs: Rfq[];
  initialVendorQuotes: VendorQuote[];
};

export function VendorQuoteEntry({ initialRfqs, initialVendorQuotes }: Props) {
  const router = useRouter();
  const [vendorQuotes, setVendorQuotes] = useState<VendorQuote[]>(initialVendorQuotes);
  const [activeTab, setActiveTab] = useState(initialRfqs[0]?.id ?? "");
  const [forms, setForms] = useState<
    Record<string, { totalPrice: string; deliveryDays: string; notes: string }>
  >(() => {
    const init: Record<string, { totalPrice: string; deliveryDays: string; notes: string }> = {};
    for (const rfq of initialRfqs) {
      const existing = initialVendorQuotes.find((vq) => vq.rfq_id === rfq.id);
      init[rfq.id] = {
        totalPrice: existing ? String(existing.total_price) : "",
        deliveryDays: existing?.delivery_days ? String(existing.delivery_days) : "",
        notes: existing?.notes ?? "",
      };
    }
    return init;
  });
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateForm(rfqId: string, field: string, value: string) {
    setForms((prev) => ({ ...prev, [rfqId]: { ...prev[rfqId], [field]: value } }));
  }

  async function handleSave(rfq: Rfq) {
    const form = forms[rfq.id];
    if (!form?.totalPrice) {
      setErrors((prev) => ({ ...prev, [rfq.id]: "السعر الإجمالي مطلوب" }));
      return;
    }
    setSaving((prev) => ({ ...prev, [rfq.id]: true }));
    setErrors((prev) => ({ ...prev, [rfq.id]: "" }));
    try {
      const res = await fetch("/api/admin/vendor-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqId: rfq.id,
          vendorId: rfq.vendor_id,
          totalPrice: parseFloat(form.totalPrice),
          deliveryDays: form.deliveryDays ? parseInt(form.deliveryDays, 10) : null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "حدث خطأ");
      // تحديث القائمة المحلية
      setVendorQuotes((prev) => {
        const filtered = prev.filter((vq) => vq.rfq_id !== rfq.id);
        return [...filtered, data.vendorQuote];
      });
      setSaved((prev) => ({ ...prev, [rfq.id]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [rfq.id]: false })), 2000);
      router.refresh();
    } catch (e: unknown) {
      setErrors((prev) => ({
        ...prev,
        [rfq.id]: e instanceof Error ? e.message : "حدث خطأ",
      }));
    } finally {
      setSaving((prev) => ({ ...prev, [rfq.id]: false }));
    }
  }

  const receivedQuotes = vendorQuotes.filter((vq) =>
    initialRfqs.some((r) => r.id === vq.rfq_id)
  );

  if (initialRfqs.length === 0) return null;

  return (
    <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5" dir="rtl">
      <h2 className="mb-1 text-sm font-bold text-[#1D3F1F]">🧾 إدخال أسعار الموردين</h2>
      <p className="mb-4 text-xs text-[#1D3F1F]/50">
        أدخل السعر الذي رد به كل مورد عبر الإيميل
      </p>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {initialRfqs.map((rfq) => {
          const hasQuote = vendorQuotes.some((vq) => vq.rfq_id === rfq.id);
          return (
            <button
              key={rfq.id}
              onClick={() => setActiveTab(rfq.id)}
              className={[
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                activeTab === rfq.id
                  ? "bg-[#1D3F1F] text-white"
                  : "bg-[#F4F3EB] text-[#1D3F1F]/70 hover:bg-[#1D3F1F]/10",
              ].join(" ")}
            >
              {rfq.vendors?.establishment_name ?? "مورد"}
              {hasQuote && <span className="text-[#09B14B]">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {initialRfqs.map((rfq) => {
        if (rfq.id !== activeTab) return null;
        const form = forms[rfq.id] ?? { totalPrice: "", deliveryDays: "", notes: "" };
        const hasQuote = vendorQuotes.some((vq) => vq.rfq_id === rfq.id);

        return (
          <div key={rfq.id} className="rounded-xl border border-[#09B14B]/20 bg-[#09B14B]/4 p-4">
            <p className="mb-3 text-xs font-semibold text-[#1D3F1F]/70">
              {rfq.vendors?.establishment_name}
              <span className="mr-2 font-normal text-[#1D3F1F]/40" dir="ltr">
                {rfq.vendors?.email}
              </span>
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-[#1D3F1F]/60">السعر الإجمالي (ر.س) *</span>
                <input
                  type="number"
                  min="0"
                  value={form.totalPrice}
                  onChange={(e) => updateForm(rfq.id, "totalPrice", e.target.value)}
                  placeholder="0"
                  className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-[#1D3F1F]/60">أيام التوريد</span>
                <input
                  type="number"
                  min="0"
                  value={form.deliveryDays}
                  onChange={(e) => updateForm(rfq.id, "deliveryDays", e.target.value)}
                  placeholder="—"
                  className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
                />
              </label>
              <label className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                <span className="text-[11px] font-medium text-[#1D3F1F]/60">ملاحظات</span>
                <input
                  value={form.notes}
                  onChange={(e) => updateForm(rfq.id, "notes", e.target.value)}
                  placeholder="شروط خاصة..."
                  className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] placeholder-[#1D3F1F]/30 focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
                />
              </label>
            </div>
            {errors[rfq.id] && (
              <p className="mt-2 text-xs text-red-600">{errors[rfq.id]}</p>
            )}
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => handleSave(rfq)}
                disabled={saving[rfq.id]}
                className="rounded-full bg-[#09B14B] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {saving[rfq.id] ? "جارٍ الحفظ..." : hasQuote ? "تحديث السعر" : "حفظ السعر"}
              </button>
              {saved[rfq.id] && (
                <span className="text-xs font-medium text-[#09B14B]">✓ تم الحفظ</span>
              )}
            </div>
          </div>
        );
      })}

      {/* جدول المقارنة */}
      {receivedQuotes.length >= 2 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold text-[#1D3F1F]/60">مقارنة عروض الموردين</p>
          <div className="overflow-x-auto rounded-xl border border-[#1D3F1F]/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1D3F1F]/10 bg-[#F4F3EB]">
                  <th className="px-3 py-2 text-right text-xs font-semibold text-[#1D3F1F]/60">المورد</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-[#1D3F1F]/60">السعر (ر.س)</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-[#1D3F1F]/60">أيام التوريد</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-[#1D3F1F]/60">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {receivedQuotes
                  .sort((a, b) => a.total_price - b.total_price)
                  .map((vq, idx) => {
                    const rfq = initialRfqs.find((r) => r.id === vq.rfq_id);
                    const isBest = idx === 0;
                    return (
                      <tr key={vq.id} className={isBest ? "bg-[#09B14B]/5" : "bg-white"}>
                        <td className="px-3 py-2 font-medium text-[#1D3F1F]">
                          {rfq?.vendors?.establishment_name ?? "—"}
                          {isBest && (
                            <span className="mr-2 rounded-full bg-[#09B14B] px-1.5 py-0.5 text-[9px] font-bold text-white">
                              الأفضل
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-semibold text-[#1D3F1F]">
                          {Number(vq.total_price).toLocaleString("ar-SA")}
                        </td>
                        <td className="px-3 py-2 text-center text-[#1D3F1F]/70">
                          {vq.delivery_days ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-[#1D3F1F]/50">{vq.notes ?? "—"}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

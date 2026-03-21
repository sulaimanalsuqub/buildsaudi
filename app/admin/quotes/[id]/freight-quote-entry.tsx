"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FreightQuote = {
  id: string;
  quote_id: string;
  price: number;
  currency: string;
  delivery_days: number | null;
  status: string;
  notes: string | null;
};

type Props = {
  quoteId: string;
  initialFreightQuotes: FreightQuote[];
};

const CURRENCIES = ["SAR", "USD", "EUR", "CNY"];

export function FreightQuoteEntry({ quoteId, initialFreightQuotes }: Props) {
  const router = useRouter();
  const [freightQuotes, setFreightQuotes] = useState<FreightQuote[]>(initialFreightQuotes);
  const [form, setForm] = useState({
    companyName: "",
    price: "",
    currency: "SAR",
    deliveryDays: "",
    notes: "",
  });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    if (!form.price) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/admin/freight-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          companyName: form.companyName || null,
          price: parseFloat(form.price),
          currency: form.currency,
          deliveryDays: form.deliveryDays ? parseInt(form.deliveryDays, 10) : null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "حدث خطأ");
      setFreightQuotes((prev) => [...prev, data.freightQuote]);
      setForm({ companyName: "", price: "", currency: "SAR", deliveryDays: "", notes: "" });
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5" dir="rtl">
      <h2 className="mb-1 text-sm font-bold text-[#1D3F1F]">🚢 أسعار الشحن والجمارك</h2>
      <p className="mb-4 text-xs text-[#1D3F1F]/50">أدخل عروض الشحن التي تلقيتها من شركات الشحن</p>

      {/* جدول الأسعار الموجودة */}
      {freightQuotes.length > 0 && (
        <div className="mb-4 overflow-x-auto rounded-xl border border-[#1D3F1F]/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1D3F1F]/10 bg-[#F4F3EB]">
                <th className="px-3 py-2 text-right text-xs font-semibold text-[#1D3F1F]/60">الشركة / الملاحظات</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-[#1D3F1F]/60">السعر</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-[#1D3F1F]/60">العملة</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-[#1D3F1F]/60">أيام التوصيل</th>
              </tr>
            </thead>
            <tbody>
              {freightQuotes
                .sort((a, b) => a.price - b.price)
                .map((fq, idx) => (
                  <tr key={fq.id} className={idx === 0 ? "bg-[#09B14B]/5" : "bg-white"}>
                    <td className="px-3 py-2 text-sm text-[#1D3F1F]">
                      {fq.notes ?? "—"}
                      {idx === 0 && freightQuotes.length > 1 && (
                        <span className="mr-2 rounded-full bg-[#09B14B] px-1.5 py-0.5 text-[9px] font-bold text-white">
                          الأقل
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center font-mono font-semibold text-[#1D3F1F]">
                      {Number(fq.price).toLocaleString("ar-SA")}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-[#1D3F1F]/60" dir="ltr">
                      {fq.currency}
                    </td>
                    <td className="px-3 py-2 text-center text-[#1D3F1F]/70">
                      {fq.delivery_days ?? "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* نموذج الإضافة */}
      <div className="rounded-xl border border-[#1D3F1F]/10 bg-[#F4F3EB]/50 p-4">
        <p className="mb-3 text-xs font-semibold text-[#1D3F1F]/70">إضافة سعر شحن</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input
            placeholder="شركة الشحن (اختياري)"
            value={form.companyName}
            onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
            className="col-span-2 rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] placeholder-[#1D3F1F]/30 focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40 sm:col-span-2"
          />
          <input
            placeholder="السعر *"
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] placeholder-[#1D3F1F]/30 focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
          />
          <select
            value={form.currency}
            onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
            className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            placeholder="أيام التوصيل"
            type="number"
            min="0"
            value={form.deliveryDays}
            onChange={(e) => setForm((p) => ({ ...p, deliveryDays: e.target.value }))}
            className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] placeholder-[#1D3F1F]/30 focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
          />
          <input
            placeholder="ملاحظات"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            className="col-span-2 rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] placeholder-[#1D3F1F]/30 focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40 sm:col-span-3"
          />
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <button
          onClick={handleAdd}
          disabled={adding || !form.price}
          className="mt-3 rounded-full bg-[#09B14B] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {adding ? "جارٍ الإضافة..." : "+ إضافة سعر شحن"}
        </button>
      </div>
    </div>
  );
}

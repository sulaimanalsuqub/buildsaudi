"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type QuoteItem = {
  id: string;
  quote_id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  category: string;
};

type Props = {
  quoteId: string;
  initialItems: QuoteItem[];
  materialsText: string;
  quoteStatus: string;
};

const UNITS = ["طن", "متر مكعب", "متر مربع", "متر طولي", "قطعة", "كيلوغرام", "لتر", "كيس", "رول", "علبة"];
const CATEGORIES = [
  "حديد تسليح", "اسمنت", "بلاط وسيراميك", "رخام", "عوازل",
  "كابلات كهربائية", "أنابيب", "دهانات", "ألمنيوم وزجاج",
  "سباكة وصحية", "أدوات كهربائية", "مواد لاصقة", "أخرى"
];

const READONLY_STATUSES = ["rfq_sent", "vendor_quotes_received", "freight_sent", "freight_received", "offer_sent", "client_approved", "payment_pending", "payment_confirmed", "in_delivery", "done"];

export function QuoteItemsEditor({ quoteId, initialItems, materialsText, quoteStatus }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<QuoteItem[]>(initialItems);
  const [form, setForm] = useState({ name: "", description: "", quantity: "", unit: "قطعة", category: "أخرى" });
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isReadonly = READONLY_STATUSES.includes(quoteStatus);

  async function handleAdd() {
    if (!form.name || !form.quantity) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/quote-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, name: form.name, description: form.description || null, quantity: parseFloat(form.quantity), unit: form.unit, category: form.category }),
      });
      const data = await res.json();
      if (data.ok) {
        setItems(prev => [...prev, data.item]);
        setForm({ name: "", description: "", quantity: "", unit: "قطعة", category: "أخرى" });
        router.refresh();
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(itemId: string) {
    setDeletingId(itemId);
    try {
      const res = await fetch("/api/admin/quote-items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (data.ok) {
        setItems(prev => prev.filter(i => i.id !== itemId));
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5" dir="rtl">
      <h2 className="mb-1 text-sm font-bold text-[#1D3F1F]">📦 بنود المواد المطلوبة</h2>
      <p className="mb-4 text-xs text-[#1D3F1F]/50">فكّك طلب العميل إلى أصناف محددة لإرسالها للموردين</p>

      {/* نص الطلب الأصلي للمرجع */}
      <div className="mb-5 rounded-xl border border-[#C5D92D]/30 bg-[#C5D92D]/8 p-3">
        <p className="mb-1 text-xs font-semibold text-[#1D3F1F]/60">نص طلب العميل (للمرجع)</p>
        <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#1D3F1F]/80">{materialsText}</p>
      </div>

      {/* جدول الأصناف */}
      {items.length > 0 && (
        <div className="mb-5 overflow-x-auto rounded-xl border border-[#1D3F1F]/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1D3F1F]/10 bg-[#F4F3EB]">
                <th className="px-3 py-2 text-right text-xs font-semibold text-[#1D3F1F]/60">الصنف</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[#1D3F1F]/60">الفئة</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-[#1D3F1F]/60">الكمية</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[#1D3F1F]/60">الوحدة</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[#1D3F1F]/60">الوصف</th>
                {!isReadonly && <th className="px-3 py-2"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-[#F4F3EB]/40"}>
                  <td className="px-3 py-2 font-medium text-[#1D3F1F]">{item.name}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-[#09B14B]/10 px-2 py-0.5 text-xs font-medium text-[#09B14B]">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center font-mono font-semibold text-[#1D3F1F]">{item.quantity}</td>
                  <td className="px-3 py-2 text-[#1D3F1F]/70">{item.unit}</td>
                  <td className="px-3 py-2 text-xs text-[#1D3F1F]/50">{item.description ?? "—"}</td>
                  {!isReadonly && (
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-40"
                      >
                        {deletingId === item.id ? "..." : "حذف"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length === 0 && (
        <div className="mb-5 rounded-xl border-2 border-dashed border-[#1D3F1F]/15 py-6 text-center">
          <p className="text-sm text-[#1D3F1F]/40">أضف أصناف المواد من نص الطلب أعلاه</p>
        </div>
      )}

      {/* نموذج الإضافة */}
      {!isReadonly && (
        <div className="rounded-xl border border-[#09B14B]/20 bg-[#09B14B]/4 p-4">
          <p className="mb-3 text-xs font-semibold text-[#1D3F1F]/70">إضافة صنف جديد</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input
              placeholder="اسم الصنف *"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="col-span-2 rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] placeholder-[#1D3F1F]/30 focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40 sm:col-span-1"
            />
            <input
              placeholder="الكمية *"
              type="number"
              min="0"
              value={form.quantity}
              onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
              className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] placeholder-[#1D3F1F]/30 focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
            />
            <select
              value={form.unit}
              onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
              className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
            >
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input
              placeholder="وصف إضافي (اختياري)"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="col-span-2 rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] placeholder-[#1D3F1F]/30 focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40 sm:col-span-2"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !form.name || !form.quantity}
            className="mt-3 rounded-full bg-[#09B14B] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {adding ? "جارٍ الإضافة..." : "+ إضافة صنف"}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type QuoteItem = { id: string; category: string; name: string };

type Vendor = {
  id: string;
  establishment_name: string;
  manager_name: string;
  email: string;
  vendor_categories: { category: string }[];
};

type Rfq = {
  id: string;
  vendor_id: string;
  status: string;
  sent_at: string | null;
  deadline: string | null;
  notes: string | null;
  vendors: { id: string; establishment_name: string; manager_name: string; email: string } | null;
};

type Props = {
  quoteId: string;
  quoteItems: QuoteItem[];
  initialRfqs: Rfq[];
  activeVendors: Vendor[];
};

const RFQ_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  sent:     { label: "أُرسل ✉️", color: "bg-purple-100 text-purple-700" },
  received: { label: "استُلم ✓", color: "bg-green-100 text-green-700" },
  declined: { label: "رُفض", color: "bg-red-100 text-red-700" },
};

export function RfqManager({ quoteId, quoteItems, initialRfqs, activeVendors }: Props) {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<Rfq[]>(initialRfqs);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // فلترة الموردين بالفئات المطابقة لأصناف الطلب
  const itemCategories = useMemo(() => new Set(quoteItems.map((i) => i.category)), [quoteItems]);
  const matchingVendors = useMemo(
    () =>
      activeVendors.filter((v) =>
        v.vendor_categories.some((vc) => itemCategories.has(vc.category))
      ),
    [activeVendors, itemCategories]
  );
  const otherVendors = useMemo(
    () => activeVendors.filter((v) => !matchingVendors.some((m) => m.id === v.id)),
    [activeVendors, matchingVendors]
  );

  // الموردين الذين أُرسل لهم RFQ بالفعل
  const alreadySentIds = new Set(rfqs.map((r) => r.vendor_id));

  function toggleVendor(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  async function handleSend() {
    if (!selected.size || !deadline) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          vendorIds: Array.from(selected),
          deadline,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "حدث خطأ");
      setSelected(new Set());
      setNotes("");
      router.refresh();
      // تحديث المحلي للـ rfqs
      const newRfqs = await fetch(`/api/admin/rfq?quoteId=${quoteId}`).then((r) => r.json());
      if (newRfqs.rfqs) setRfqs(newRfqs.rfqs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setSending(false);
    }
  }

  const allVendors = [...matchingVendors, ...otherVendors];

  return (
    <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5" dir="rtl">
      <h2 className="mb-1 text-sm font-bold text-[#1D3F1F]">📨 إرسال طلب عرض سعر (RFQ) للموردين</h2>
      <p className="mb-4 text-xs text-[#1D3F1F]/50">اختر الموردين المناسبين وأرسل طلب عرض سعر بإيميل تلقائي</p>

      {/* RFQs المُرسَلة */}
      {rfqs.length > 0 && (
        <div className="mb-5 overflow-x-auto rounded-xl border border-[#1D3F1F]/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1D3F1F]/10 bg-[#F4F3EB]">
                <th className="px-3 py-2 text-right text-xs font-semibold text-[#1D3F1F]/60">المورد</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[#1D3F1F]/60">البريد</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-[#1D3F1F]/60">الحالة</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[#1D3F1F]/60">الموعد النهائي</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map((rfq, idx) => {
                const st = RFQ_STATUS_LABELS[rfq.status] ?? { label: rfq.status, color: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={rfq.id} className={idx % 2 === 0 ? "bg-white" : "bg-[#F4F3EB]/40"}>
                    <td className="px-3 py-2 font-medium text-[#1D3F1F]">
                      {rfq.vendors?.establishment_name ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-[#1D3F1F]/50" dir="ltr">
                      {rfq.vendors?.email ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-[#1D3F1F]/60">
                      {rfq.deadline
                        ? new Date(rfq.deadline).toLocaleDateString("ar-SA")
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* نموذج إرسال RFQ جديد */}
      <div className="rounded-xl border border-[#C5D92D]/30 bg-[#C5D92D]/8 p-4">
        <p className="mb-3 text-xs font-semibold text-[#1D3F1F]/70">إرسال RFQ جديد</p>

        {/* قائمة الموردين */}
        {allVendors.length === 0 ? (
          <p className="mb-3 text-xs text-[#1D3F1F]/40">لا يوجد موردون نشطون في النظام</p>
        ) : (
          <div className="mb-3 max-h-52 overflow-y-auto rounded-lg border border-[#1D3F1F]/10 bg-white">
            {matchingVendors.length > 0 && (
              <p className="border-b border-[#1D3F1F]/5 bg-[#09B14B]/5 px-3 py-1.5 text-[10px] font-semibold text-[#09B14B]">
                ✓ موردون مطابقون للفئات ({matchingVendors.length})
              </p>
            )}
            {matchingVendors.map((v) => (
              <VendorRow
                key={v.id}
                vendor={v}
                checked={selected.has(v.id)}
                disabled={alreadySentIds.has(v.id)}
                onToggle={() => toggleVendor(v.id)}
              />
            ))}
            {otherVendors.length > 0 && (
              <p className="border-b border-[#1D3F1F]/5 border-t border-[#1D3F1F]/10 bg-[#F4F3EB] px-3 py-1.5 text-[10px] font-semibold text-[#1D3F1F]/50">
                موردون آخرون ({otherVendors.length})
              </p>
            )}
            {otherVendors.map((v) => (
              <VendorRow
                key={v.id}
                vendor={v}
                checked={selected.has(v.id)}
                disabled={alreadySentIds.has(v.id)}
                onToggle={() => toggleVendor(v.id)}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-[#1D3F1F]/60">الموعد النهائي للرد *</span>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-[#1D3F1F]/60">ملاحظات (اختياري)</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="تعليمات خاصة للمورد"
              className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] placeholder-[#1D3F1F]/30 focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
            />
          </label>
        </div>

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-[#1D3F1F]/50">
            {selected.size > 0 ? `${selected.size} مورد مختار` : "اختر موردين من القائمة أعلاه"}
          </span>
          <button
            onClick={handleSend}
            disabled={sending || !selected.size || !deadline}
            className="rounded-full bg-[#1D3F1F] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {sending ? "جارٍ الإرسال..." : `إرسال RFQ لـ ${selected.size || "..."} مورد ✉️`}
          </button>
        </div>
      </div>
    </div>
  );
}

function VendorRow({
  vendor,
  checked,
  disabled,
  onToggle,
}: {
  vendor: Vendor;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={[
        "flex cursor-pointer items-center gap-3 border-b border-[#1D3F1F]/5 px-3 py-2.5 last:border-0 hover:bg-[#F4F3EB]/60",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        className="accent-[#09B14B]"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1D3F1F] truncate">{vendor.establishment_name}</p>
        <p className="text-xs text-[#1D3F1F]/50 truncate" dir="ltr">{vendor.email}</p>
      </div>
      {disabled && (
        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
          أُرسل
        </span>
      )}
    </label>
  );
}

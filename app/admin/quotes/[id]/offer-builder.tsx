"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OfferBuilder({
  quoteId,
  clientName,
  clientEmail,
  projectName,
  deliveryAddress,
  deliveryDate,
}: {
  quoteId: string;
  clientName: string;
  clientEmail: string;
  projectName: string;
  deliveryAddress: string;
  deliveryDate: string;
}) {
  const [materialsTotal, setMaterialsTotal] = useState("");
  const [freightTotal, setFreightTotal] = useState("");
  const [platformFee, setPlatformFee] = useState("");
  const [validityDays, setValidityDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const materials = parseFloat(materialsTotal.replace(/,/g, "")) || 0;
  const freight = parseFloat(freightTotal.replace(/,/g, "")) || 0;
  const fee = parseFloat(platformFee.replace(/,/g, "")) || 0;
  const grand = materials + freight + fee;

  const fmt = (n: number) =>
    n > 0 ? n.toLocaleString("ar-SA", { minimumFractionDigits: 0 }) + " ر.س" : "—";

  const handleSubmit = async () => {
    if (!materials || !freight) {
      setError("يجب إدخال قيمة المواد وسعر الشحن على الأقل");
      return;
    }
    if (!clientEmail) {
      setError("لا يوجد بريد إلكتروني للعميل — لا يمكن إرسال العرض");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/offer/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          clientName,
          clientEmail,
          projectName,
          deliveryAddress,
          deliveryDate,
          materialsTotal: materials,
          freightTotal: freight,
          platformFee: fee,
          grandTotal: grand,
          validityDays: parseInt(validityDays, 10),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "حدث خطأ");
      }
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[16px] border border-[#09B14B]/30 bg-[#f0fdf4] p-5">
      <h2 className="mb-1 text-sm font-semibold text-[#1D3F1F]">بناء عرض السعر DDP</h2>
      <p className="mb-4 text-xs text-[#1D3F1F]/55">
        أدخل الأرقام ثم اضغط "إرسال العرض" — سيصل إيميل للعميل بالتفاصيل ورابط للموافقة
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#1D3F1F]/60">قيمة المواد (ر.س) *</span>
          <input
            type="number"
            min="0"
            value={materialsTotal}
            onChange={(e) => setMaterialsTotal(e.target.value)}
            placeholder="0"
            className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] focus:border-[#09B14B] focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#1D3F1F]/60">الشحن والجمارك (ر.س) *</span>
          <input
            type="number"
            min="0"
            value={freightTotal}
            onChange={(e) => setFreightTotal(e.target.value)}
            placeholder="0"
            className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] focus:border-[#09B14B] focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#1D3F1F]/60">رسوم المنصة (ر.س)</span>
          <input
            type="number"
            min="0"
            value={platformFee}
            onChange={(e) => setPlatformFee(e.target.value)}
            placeholder="0"
            className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] focus:border-[#09B14B] focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#1D3F1F]/60">صلاحية العرض (أيام)</span>
          <input
            type="number"
            min="1"
            max="30"
            value={validityDays}
            onChange={(e) => setValidityDays(e.target.value)}
            className="rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] focus:border-[#09B14B] focus:outline-none"
          />
        </label>
      </div>

      {/* Grand Total */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-[#09B14B]/20 bg-white px-4 py-3">
        <span className="text-sm font-semibold text-[#1D3F1F]">الإجمالي DDP</span>
        <span className="text-lg font-bold text-[#09B14B]" dir="ltr">{fmt(grand)}</span>
      </div>

      {!clientEmail && (
        <p className="mt-3 text-xs text-red-600">
          ⚠️ لا يوجد بريد إلكتروني للعميل — أضفه من قاعدة البيانات لتتمكن من إرسال العرض
        </p>
      )}

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading || !clientEmail}
        className="mt-4 rounded-full bg-[#09B14B] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1D3F1F] disabled:opacity-50"
      >
        {loading ? "جارٍ الإرسال..." : "إرسال العرض للعميل ✉️"}
      </button>
    </div>
  );
}

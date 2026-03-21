"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type VendorQuote = {
  id: string;
  rfq_id: string;
  vendor_id: string;
  total_price: number;
  delivery_days: number | null;
  notes: string | null;
  vendorName?: string;
};

type FreightQuote = {
  id: string;
  price: number;
  currency: string;
  delivery_days: number | null;
  notes: string | null;
};

type Props = {
  quoteId: string;
  clientName: string;
  clientEmail: string;
  projectName: string;
  deliveryAddress: string;
  deliveryDate: string;
  initialVendorQuotes: VendorQuote[];
  initialFreightQuotes: FreightQuote[];
};

export function OfferBuilder({
  quoteId,
  clientName,
  clientEmail,
  projectName,
  deliveryAddress,
  deliveryDate,
  initialVendorQuotes,
  initialFreightQuotes,
}: Props) {
  const router = useRouter();

  const [selectedVqId, setSelectedVqId] = useState(initialVendorQuotes[0]?.id ?? "");
  const [marginMode, setMarginMode] = useState<"percent" | "fixed">("percent");
  const [marginValue, setMarginValue] = useState("");
  const [selectedFqId, setSelectedFqId] = useState(
    initialFreightQuotes[0]?.id ?? "manual"
  );
  const [manualFreight, setManualFreight] = useState("");
  const [platformFee, setPlatformFee] = useState("0");
  const [validityDays, setValidityDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedVq = initialVendorQuotes.find((vq) => vq.id === selectedVqId);
  const vendorCost = selectedVq ? Number(selectedVq.total_price) : 0;

  const margin = useMemo(() => {
    const v = parseFloat(marginValue) || 0;
    if (marginMode === "percent") return vendorCost * (v / 100);
    return v;
  }, [vendorCost, marginValue, marginMode]);

  const materialsTotal = vendorCost + margin;

  const selectedFq = initialFreightQuotes.find((fq) => fq.id === selectedFqId);
  const freightTotal =
    selectedFqId === "manual"
      ? parseFloat(manualFreight) || 0
      : selectedFq
        ? Number(selectedFq.price)
        : 0;

  const fee = parseFloat(platformFee) || 0;
  const grandTotal = materialsTotal + freightTotal + fee;

  const fmt = (n: number) =>
    n > 0 ? n.toLocaleString("ar-SA", { minimumFractionDigits: 0 }) + " ر.س" : "—";

  const handleSubmit = async () => {
    if (!materialsTotal || !freightTotal) {
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
          materialsTotal,
          freightTotal,
          platformFee: fee,
          grandTotal,
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
    <div className="rounded-[16px] border border-[#09B14B]/30 bg-[#f0fdf4] p-5" dir="rtl">
      <h2 className="mb-1 text-sm font-semibold text-[#1D3F1F]">📋 بناء عرض السعر النهائي DDP</h2>
      <p className="mb-5 text-xs text-[#1D3F1F]/55">
        اختر عرض المورد، أضف هامش الربح، واختر سعر الشحن — ثم أرسل العرض للعميل
      </p>

      {/* القسم ١: اختيار عرض المورد */}
      {initialVendorQuotes.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold text-[#1D3F1F]/70">١. اختر عرض المورد</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {initialVendorQuotes
              .sort((a, b) => a.total_price - b.total_price)
              .map((vq, idx) => (
                <label
                  key={vq.id}
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all",
                    selectedVqId === vq.id
                      ? "border-[#09B14B] bg-[#09B14B]/8 shadow-sm"
                      : "border-[#1D3F1F]/10 bg-white hover:border-[#09B14B]/40",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="vendorQuote"
                    value={vq.id}
                    checked={selectedVqId === vq.id}
                    onChange={() => setSelectedVqId(vq.id)}
                    className="mt-0.5 accent-[#09B14B]"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1D3F1F]">
                      {vq.vendorName ?? `مورد ${idx + 1}`}
                      {idx === 0 && initialVendorQuotes.length > 1 && (
                        <span className="mr-2 rounded-full bg-[#09B14B] px-1.5 py-0.5 text-[9px] font-bold text-white">
                          الأقل سعراً
                        </span>
                      )}
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold text-[#1D3F1F]">
                      {Number(vq.total_price).toLocaleString("ar-SA")} ر.س
                    </p>
                    {vq.delivery_days && (
                      <p className="text-xs text-[#1D3F1F]/50">{vq.delivery_days} يوم توريد</p>
                    )}
                    {vq.notes && <p className="text-xs text-[#1D3F1F]/50">{vq.notes}</p>}
                  </div>
                </label>
              ))}
          </div>
          {initialVendorQuotes.length === 0 && (
            <p className="rounded-xl border border-[#1D3F1F]/10 bg-white p-3 text-xs text-[#1D3F1F]/40">
              لا توجد عروض موردين — أدخلها في القسم أعلاه أولاً
            </p>
          )}
        </div>
      )}

      {/* إدخال يدوي إذا لم تكن هناك عروض موردين */}
      {initialVendorQuotes.length === 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold text-[#1D3F1F]/70">١. قيمة المواد (ر.س) *</p>
          <input
            type="number"
            min="0"
            value={marginValue}
            onChange={(e) => setMarginValue(e.target.value)}
            placeholder="0"
            className="w-48 rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
          />
        </div>
      )}

      {/* القسم ٢: هامش الربح */}
      {initialVendorQuotes.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold text-[#1D3F1F]/70">٢. هامش الربح</p>
          <div className="flex items-center gap-2 rounded-xl border border-[#1D3F1F]/10 bg-white p-3">
            <div className="flex overflow-hidden rounded-lg border border-[#1D3F1F]/10">
              <button
                onClick={() => setMarginMode("percent")}
                className={[
                  "px-3 py-1.5 text-xs font-medium transition-all",
                  marginMode === "percent"
                    ? "bg-[#1D3F1F] text-white"
                    : "bg-white text-[#1D3F1F]/60 hover:bg-[#F4F3EB]",
                ].join(" ")}
              >
                نسبة %
              </button>
              <button
                onClick={() => setMarginMode("fixed")}
                className={[
                  "px-3 py-1.5 text-xs font-medium transition-all",
                  marginMode === "fixed"
                    ? "bg-[#1D3F1F] text-white"
                    : "bg-white text-[#1D3F1F]/60 hover:bg-[#F4F3EB]",
                ].join(" ")}
              >
                مبلغ ثابت ر.س
              </button>
            </div>
            <input
              type="number"
              min="0"
              value={marginValue}
              onChange={(e) => setMarginValue(e.target.value)}
              placeholder={marginMode === "percent" ? "0 %" : "0 ر.س"}
              className="flex-1 rounded-lg border border-[#1D3F1F]/15 px-3 py-1.5 text-sm text-[#1D3F1F] focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
            />
            {margin > 0 && (
              <span className="text-xs font-semibold text-[#09B14B]">+ {fmt(margin)}</span>
            )}
          </div>
        </div>
      )}

      {/* القسم ٣: سعر الشحن */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold text-[#1D3F1F]/70">
          {initialVendorQuotes.length > 0 ? "٣." : "٢."} الشحن والجمارك DDP
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {initialFreightQuotes
            .sort((a, b) => a.price - b.price)
            .map((fq, idx) => (
              <label
                key={fq.id}
                className={[
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all",
                  selectedFqId === fq.id
                    ? "border-[#09B14B] bg-[#09B14B]/8"
                    : "border-[#1D3F1F]/10 bg-white hover:border-[#09B14B]/40",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="freightQuote"
                  value={fq.id}
                  checked={selectedFqId === fq.id}
                  onChange={() => setSelectedFqId(fq.id)}
                  className="mt-0.5 accent-[#09B14B]"
                />
                <div>
                  <p className="text-xs font-medium text-[#1D3F1F]">
                    {fq.notes ?? `شحن ${idx + 1}`}
                    {idx === 0 && initialFreightQuotes.length > 1 && (
                      <span className="mr-2 rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-700">
                        الأقل
                      </span>
                    )}
                  </p>
                  <p className="mt-1 font-mono font-bold text-[#1D3F1F]">
                    {Number(fq.price).toLocaleString("ar-SA")} {fq.currency}
                  </p>
                  {fq.delivery_days && (
                    <p className="text-xs text-[#1D3F1F]/50">{fq.delivery_days} يوم</p>
                  )}
                </div>
              </label>
            ))}
          {/* إدخال يدوي */}
          <label
            className={[
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all",
              selectedFqId === "manual"
                ? "border-[#09B14B] bg-[#09B14B]/8"
                : "border-[#1D3F1F]/10 bg-white hover:border-[#09B14B]/40",
            ].join(" ")}
          >
            <input
              type="radio"
              name="freightQuote"
              value="manual"
              checked={selectedFqId === "manual"}
              onChange={() => setSelectedFqId("manual")}
              className="mt-0.5 accent-[#09B14B]"
            />
            <div className="flex-1">
              <p className="text-xs font-medium text-[#1D3F1F]">إدخال يدوي</p>
              {selectedFqId === "manual" && (
                <input
                  type="number"
                  min="0"
                  value={manualFreight}
                  onChange={(e) => setManualFreight(e.target.value)}
                  placeholder="0 ر.س"
                  className="mt-1.5 w-full rounded-lg border border-[#1D3F1F]/15 bg-white px-2 py-1.5 text-sm text-[#1D3F1F] focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
                />
              )}
            </div>
          </label>
        </div>
      </div>

      {/* ملخص العرض */}
      <div className="mb-5 rounded-xl border border-[#09B14B]/20 bg-white p-4">
        <p className="mb-3 text-xs font-semibold text-[#1D3F1F]/60">ملخص العرض</p>
        <div className="space-y-2">
          {vendorCost > 0 && <SummaryRow label="سعر المورد الأساسي" value={fmt(vendorCost)} />}
          {margin > 0 && (
            <SummaryRow
              label={`هامش الربح (${marginMode === "percent" ? marginValue + "%" : "ثابت"})`}
              value={fmt(margin)}
              highlight
            />
          )}
          {materialsTotal > 0 && (
            <SummaryRow label="قيمة المواد النهائية" value={fmt(materialsTotal)} bold />
          )}
          {freightTotal > 0 && (
            <SummaryRow label="الشحن والجمارك DDP" value={fmt(freightTotal)} />
          )}
          {fee > 0 && <SummaryRow label="رسوم إضافية" value={fmt(fee)} />}
          <div className="border-t border-[#1D3F1F]/10 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#1D3F1F]">الإجمالي DDP</span>
              <span className="text-xl font-bold text-[#09B14B]" dir="ltr">
                {fmt(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* خيارات إضافية */}
      <div className="mb-5 flex flex-wrap gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#1D3F1F]/60">رسوم إضافية (ر.س)</span>
          <input
            type="number"
            min="0"
            value={platformFee}
            onChange={(e) => setPlatformFee(e.target.value)}
            placeholder="0"
            className="w-32 rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
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
            className="w-24 rounded-lg border border-[#1D3F1F]/15 bg-white px-3 py-2 text-sm text-[#1D3F1F] focus:outline-none focus:ring-1 focus:ring-[#09B14B]/40"
          />
        </label>
      </div>

      {!clientEmail && (
        <p className="mb-3 text-xs text-red-600">
          ⚠️ لا يوجد بريد إلكتروني للعميل — أضفه من قاعدة البيانات لتتمكن من إرسال العرض
        </p>
      )}
      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading || !clientEmail || !materialsTotal || !freightTotal}
        className="rounded-full bg-[#09B14B] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1D3F1F] disabled:opacity-50"
      >
        {loading ? "جارٍ الإرسال..." : "إرسال العرض للعميل ✉️"}
      </button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={[
          "text-sm text-[#1D3F1F]",
          bold ? "font-semibold" : "",
          highlight ? "text-[#09B14B]" : "",
        ].join(" ")}
      >
        {label}
      </span>
      <span
        className={[
          "font-mono text-sm",
          bold ? "font-bold text-[#1D3F1F]" : "text-[#1D3F1F]/70",
          highlight ? "text-[#09B14B]" : "",
        ].join(" ")}
        dir="ltr"
      >
        {value}
      </span>
    </div>
  );
}

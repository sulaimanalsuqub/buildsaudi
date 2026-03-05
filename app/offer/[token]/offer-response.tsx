"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OfferResponse({ token }: { token: string }) {
  const [loading, setLoading] = useState<"accepted" | "rejected" | null>(null);
  const [done, setDone] = useState<"accepted" | "rejected" | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const respond = async (action: "accepted" | "rejected") => {
    setLoading(action);
    setError("");
    try {
      const res = await fetch("/api/offer/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "حدث خطأ");
      setDone(action);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoading(null);
    }
  };

  if (done === "accepted") {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-5 text-center">
        <p className="text-2xl mb-2">✅</p>
        <p className="font-bold text-green-700">تم قبول العرض بنجاح</p>
        <p className="text-sm text-green-600 mt-1">سيتواصل معك فريق Build Saudi قريباً لإتمام الدفع والتوريد</p>
      </div>
    );
  }

  if (done === "rejected") {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-5 text-center">
        <p className="text-2xl mb-2">❌</p>
        <p className="font-bold text-red-700">تم رفض العرض</p>
        <p className="text-sm text-red-600 mt-1">يمكنك التواصل مع فريقنا لمناقشة تعديل العرض</p>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-[#1D3F1F]">ردك على العرض</h2>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => respond("accepted")}
          disabled={!!loading}
          className="flex-1 rounded-full bg-[#09B14B] py-3 text-sm font-bold text-white transition hover:bg-[#1D3F1F] disabled:opacity-50"
        >
          {loading === "accepted" ? "جارٍ القبول..." : "✅ قبول العرض والمضي في التوريد"}
        </button>
        <button
          onClick={() => respond("rejected")}
          disabled={!!loading}
          className="flex-1 rounded-full border border-red-300 bg-red-50 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
        >
          {loading === "rejected" ? "..." : "❌ رفض العرض"}
        </button>
      </div>
      {error && <p className="mt-3 text-xs text-red-600 text-center">{error}</p>}
      <p className="mt-3 text-xs text-center text-[#1D3F1F]/40">
        بالقبول تؤكد موافقتك على السعر والشروط المذكورة
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ApproveQuoteButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const approve = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/update-quote-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: id, status: "admin_approved" }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "حدث خطأ");
        return;
      }

      toast.success("تم اعتماد الطلب");
      router.refresh();
    } catch {
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={approve}
      disabled={loading}
      className="rounded-full bg-[#09B14B] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#1D3F1F] disabled:opacity-60"
    >
      {loading ? "..." : "اعتماد"}
    </button>
  );
}

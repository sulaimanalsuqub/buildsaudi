"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  id: string;
  currentStatus: string;
}

export function VendorStatusButton({ id, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const update = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vendor-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: id, status }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "حدث خطأ");
        return;
      }

      toast.success(
        status === "active" ? "تم تفعيل المورد" :
        status === "rejected" ? "تم رفض المورد" :
        "تم إيقاف المورد"
      );
      router.refresh();
    } catch {
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === "pending") {
    return (
      <div className="flex gap-1.5">
        <button
          onClick={() => update("active")}
          disabled={loading}
          className="rounded-full bg-[#09B14B] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#1D3F1F] disabled:opacity-60"
        >
          تفعيل
        </button>
        <button
          onClick={() => update("rejected")}
          disabled={loading}
          className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-100 disabled:opacity-60"
        >
          رفض
        </button>
      </div>
    );
  }

  if (currentStatus === "active") {
    return (
      <button
        onClick={() => update("paused")}
        disabled={loading}
        className="rounded-full border border-[#1D3F1F]/15 bg-[#F4F3EB] px-3 py-1.5 text-xs font-semibold text-[#1D3F1F]/60 transition-all hover:bg-[#1D3F1F]/10 disabled:opacity-60"
      >
        إيقاف
      </button>
    );
  }

  if (currentStatus === "paused" || currentStatus === "rejected") {
    return (
      <button
        onClick={() => update("active")}
        disabled={loading}
        className="rounded-full bg-[#09B14B] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#1D3F1F] disabled:opacity-60"
      >
        تفعيل
      </button>
    );
  }

  return <span className="text-xs text-[#1D3F1F]/30">—</span>;
}

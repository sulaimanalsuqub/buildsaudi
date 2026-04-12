"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  id: string;
  currentStatus: string;
  vendorEmail?: string;
  vendorName?: string;
  managerName?: string;
}

export function VendorStatusButton({ id, currentStatus, vendorEmail, vendorName, managerName }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const update = async (status: string) => {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("vendors").update({ status }).eq("id", id);

    // تسجيل في سجل الموافقات
    await supabase.from("approvals").insert({
      entity_type: "vendor",
      entity_id: id,
      stage: status === "active" ? "activate_vendor" : status === "rejected" ? "activate_vendor" : "activate_vendor",
      action: status === "active" ? "approved" : "rejected",
      actor: "admin",
      notes: `${currentStatus} → ${status}`,
    });

    // إرسال إيميل عند التفعيل أو الرفض
    if (vendorEmail && vendorName && (status === "active" || status === "rejected")) {
      fetch("/api/email/vendor-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: status === "active" ? "activated" : "rejected",
          vendor: {
            establishment_name: vendorName,
            manager_name: managerName ?? vendorName,
            email: vendorEmail,
          },
        }),
      }).catch(() => {});
    }

    router.refresh();
    setLoading(false);
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

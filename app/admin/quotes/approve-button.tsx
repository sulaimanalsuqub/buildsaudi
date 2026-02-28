"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ApproveQuoteButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const approve = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("quotes")
      .update({ status: "admin_approved" })
      .eq("id", id);
    router.refresh();
    setLoading(false);
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

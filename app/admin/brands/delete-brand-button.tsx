"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function DeleteBrandButton({
  id,
  name,
  vendorCount,
}: {
  id: string;
  name: string;
  vendorCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const msg =
      vendorCount > 0
        ? `هذه العلامة مرتبطة بـ ${vendorCount} مورد. هل تريد حذفها؟`
        : `هل تريد حذف "${name}"؟`;
    if (!confirm(msg)) return;

    setLoading(true);
    const supabase = createClient();
    await supabase.from("brands").delete().eq("id", id);
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg px-2.5 py-1 text-xs text-[#1D3F1F]/30 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 transition-colors"
    >
      {loading ? "..." : "حذف"}
    </button>
  );
}

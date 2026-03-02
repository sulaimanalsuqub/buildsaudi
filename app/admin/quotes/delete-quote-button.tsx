"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteQuoteButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟")) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("quotes").delete().eq("id", id);
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
    >
      {loading ? "..." : "حذف"}
    </button>
  );
}

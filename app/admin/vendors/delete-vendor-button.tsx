"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteVendorButton({ id, redirect = false }: { id: string; redirect?: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا المورد نهائياً؟ لا يمكن التراجع.")) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("vendors").delete().eq("id", id);
    if (redirect) {
      router.push("/admin/vendors");
    } else {
      router.refresh();
    }
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

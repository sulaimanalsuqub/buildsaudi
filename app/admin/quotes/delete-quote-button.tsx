"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
export function DeleteQuoteButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟")) return;
    setLoading(true);
    const res = await fetch("/api/admin/delete-quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId: id }),
    });
    if (res.ok) router.refresh();
    setLoading(false);
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

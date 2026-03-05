"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteVendorButton({ id, redirect = false }: { id: string; redirect?: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا المورد نهائياً؟ لا يمكن التراجع.")) return;
    setLoading(true);
    const res = await fetch("/api/admin/delete-vendor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId: id }),
    });
    if (res.ok) {
      if (redirect) {
        router.push("/admin/vendors");
      } else {
        router.refresh();
      }
    }
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

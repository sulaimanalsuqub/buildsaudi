"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteBrandButton({ id, name, vendorCount }: { id: string; name: string; vendorCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    setOpen(false);
    const res = await fetch("/api/admin/brands", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      toast.error("فشل حذف العلامة التجارية");
    } else {
      toast.success(`تم حذف "${name}"`);
      router.refresh();
    }
    setLoading(false);
  };

  const description = vendorCount > 0
    ? `هذه العلامة مرتبطة بـ ${vendorCount} مورد. هل تريد حذفها؟`
    : `هل تريد حذف "${name}"؟`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={loading}
        className="rounded-lg px-2.5 py-1 text-xs text-[#1D3F1F]/30 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 transition-colors"
      >
        {loading ? "..." : "حذف"}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="حذف العلامة التجارية"
        description={description}
        confirmLabel="حذف"
        variant="danger"
        onConfirm={handleDelete}
        loading={loading}
      />
    </>
  );
}
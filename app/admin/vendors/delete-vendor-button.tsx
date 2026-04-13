"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteVendorButton({ id, redirect = false }: { id: string; redirect?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    setOpen(false);
    const res = await fetch("/api/admin/delete-vendor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId: id }),
    });
    if (res.ok) {
      toast.success("تم حذف المورد");
      if (redirect) {
        router.push("/admin/vendors");
      } else {
        router.refresh();
      }
    } else {
      toast.error("فشل حذف المورد");
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={loading}
        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
      >
        {loading ? "..." : "حذف"}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="حذف المورد"
        description="هل أنت متأكد من حذف هذا المورد نهائياً؟ لا يمكن التراجع."
        confirmLabel="حذف"
        variant="danger"
        onConfirm={handleDelete}
        loading={loading}
      />
    </>
  );
}

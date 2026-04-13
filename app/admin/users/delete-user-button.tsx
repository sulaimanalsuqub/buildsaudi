"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteUserButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "حدث خطأ");
        return;
      }
      toast.success("تم حذف المستخدم");
      router.refresh();
    } finally {
      setLoading(false);
    }
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
        title="حذف المستخدم"
        description="هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع."
        confirmLabel="حذف"
        variant="danger"
        onConfirm={handleDelete}
        loading={loading}
      />
    </>
  );
}

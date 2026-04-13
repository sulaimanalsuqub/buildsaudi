"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  loading?: boolean;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  variant = "default",
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <AlertDialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-xl"
          dir="rtl"
        >
          <AlertDialog.Title className="text-lg font-bold text-[#1D3F1F]">
            {title}
          </AlertDialog.Title>
          {description && (
            <AlertDialog.Description className="mt-2 text-sm text-[#1D3F1F]/70 leading-relaxed">
              {description}
            </AlertDialog.Description>
          )}
          <div className="mt-5 flex gap-3 justify-end">
            <AlertDialog.Cancel asChild>
              <button className="rounded-full border border-[#1D3F1F]/20 px-5 py-2.5 text-sm font-semibold text-[#1D3F1F] hover:bg-[#1D3F1F]/5">
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${
                isDanger
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-[#09B14B] hover:bg-[#1D3F1F]"
              }`}
            >
              {loading ? "..." : confirmLabel}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

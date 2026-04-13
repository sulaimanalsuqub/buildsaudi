"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

export function OfferResponse({ token, grandTotal }: { token: string; grandTotal?: string }) {
  const [loading, setLoading] = useState<"accepted" | "rejected" | "modification" | null>(null);
  const [done, setDone] = useState<"accepted" | "rejected" | "modification" | null>(null);
  const [error, setError] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [modificationNote, setModificationNote] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const router = useRouter();

  const respond = async (action: "accepted" | "rejected", reason?: string) => {
    setLoading(action);
    setError("");
    try {
      const res = await fetch("/api/offer/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "حدث خطأ");
      setDone(action);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoading(null);
    }
  };

  const requestModification = async () => {
    if (!modificationNote.trim()) return;
    setLoading("modification");
    setError("");
    try {
      const res = await fetch("/api/offer/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "modification_requested", reason: modificationNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "حدث خطأ");
      setDone("modification");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoading(null);
      setShowModifyDialog(false);
    }
  };

  if (done === "accepted") {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-5 text-center">
        <p className="text-2xl mb-2">✅</p>
        <p className="font-bold text-green-700">تم قبول العرض بنجاح</p>
        <p className="text-sm text-green-600 mt-1">سيتواصل معك فريق Build Saudi قريباً لإتمام الدفع والتوريد</p>
      </div>
    );
  }

  if (done === "rejected") {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-5 text-center">
        <p className="text-2xl mb-2">❌</p>
        <p className="font-bold text-red-700">تم رفض العرض</p>
        <p className="text-sm text-red-600 mt-1">شكراً لردك. يمكنك التواصل مع فريقنا في أي وقت</p>
      </div>
    );
  }

  if (done === "modification") {
    return (
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-5 text-center">
        <p className="text-2xl mb-2">📝</p>
        <p className="font-bold text-blue-700">تم إرسال طلب التعديل</p>
        <p className="text-sm text-blue-600 mt-1">سيراجع فريقنا ملاحظاتك ويتواصل معك قريباً</p>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-[#1D3F1F]">ردك على العرض</h2>
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* زر القبول */}
        <AlertDialog.Root open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
          <AlertDialog.Trigger asChild>
            <button
              disabled={!!loading}
              className="flex-1 rounded-full bg-[#09B14B] py-3 text-sm font-bold text-white transition hover:bg-[#1D3F1F] disabled:opacity-50"
            >
              ✅ قبول العرض
            </button>
          </AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
            <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-xl" dir="rtl">
              <AlertDialog.Title className="text-lg font-bold text-[#1D3F1F]">تأكيد قبول العرض</AlertDialog.Title>
              <AlertDialog.Description className="mt-3 text-sm text-[#1D3F1F]/70 leading-relaxed">
                بالقبول تؤكد موافقتك على السعر والشروط المذكورة.
                {grandTotal && (
                  <span className="block mt-2 text-base font-bold text-[#09B14B]">
                    الإجمالي: {grandTotal}
                  </span>
                )}
              </AlertDialog.Description>
              <div className="mt-5 flex gap-3 justify-end">
                <AlertDialog.Cancel asChild>
                  <button className="rounded-full border border-[#1D3F1F]/20 px-5 py-2.5 text-sm font-semibold text-[#1D3F1F] hover:bg-[#1D3F1F]/5">
                    إلغاء
                  </button>
                </AlertDialog.Cancel>
                <button
                  onClick={() => { setShowAcceptDialog(false); respond("accepted"); }}
                  disabled={loading === "accepted"}
                  className="rounded-full bg-[#09B14B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1D3F1F] disabled:opacity-50"
                >
                  {loading === "accepted" ? "جارٍ القبول..." : "تأكيد القبول"}
                </button>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>

        {/* زر طلب تعديل */}
        <AlertDialog.Root open={showModifyDialog} onOpenChange={setShowModifyDialog}>
          <AlertDialog.Trigger asChild>
            <button
              disabled={!!loading}
              className="flex-1 rounded-full border border-blue-300 bg-blue-50 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
            >
              📝 طلب تعديل
            </button>
          </AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
            <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-xl" dir="rtl">
              <AlertDialog.Title className="text-lg font-bold text-[#1D3F1F]">طلب تعديل على العرض</AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-[#1D3F1F]/70">
                اكتب ملاحظاتك أو التعديلات المطلوبة وسنراجعها
              </AlertDialog.Description>
              <textarea
                value={modificationNote}
                onChange={(e) => setModificationNote(e.target.value)}
                placeholder="مثال: أرغب بتعديل الكميات، أو السعر مرتفع قليلاً..."
                rows={3}
                className="mt-3 w-full rounded-xl border border-[#1D3F1F]/15 px-4 py-3 text-sm text-[#1D3F1F] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
              />
              <div className="mt-4 flex gap-3 justify-end">
                <AlertDialog.Cancel asChild>
                  <button className="rounded-full border border-[#1D3F1F]/20 px-5 py-2.5 text-sm font-semibold text-[#1D3F1F] hover:bg-[#1D3F1F]/5">
                    إلغاء
                  </button>
                </AlertDialog.Cancel>
                <button
                  onClick={requestModification}
                  disabled={!modificationNote.trim() || loading === "modification"}
                  className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading === "modification" ? "جارٍ الإرسال..." : "إرسال الطلب"}
                </button>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>

        {/* زر الرفض */}
        <AlertDialog.Root open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialog.Trigger asChild>
            <button
              disabled={!!loading}
              className="flex-1 rounded-full border border-red-300 bg-red-50 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              ❌ رفض العرض
            </button>
          </AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
            <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-xl" dir="rtl">
              <AlertDialog.Title className="text-lg font-bold text-[#1D3F1F]">تأكيد رفض العرض</AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-[#1D3F1F]/70">
                هل أنت متأكد من رفض هذا العرض؟
              </AlertDialog.Description>
              <div className="mt-3">
                <label className="text-xs font-semibold text-[#1D3F1F]/60">سبب الرفض (اختياري)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="مثال: السعر مرتفع، أو وجدت مورد آخر..."
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-[#1D3F1F]/15 px-4 py-3 text-sm text-[#1D3F1F] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
                />
              </div>
              <div className="mt-4 flex gap-3 justify-end">
                <AlertDialog.Cancel asChild>
                  <button className="rounded-full border border-[#1D3F1F]/20 px-5 py-2.5 text-sm font-semibold text-[#1D3F1F] hover:bg-[#1D3F1F]/5">
                    إلغاء
                  </button>
                </AlertDialog.Cancel>
                <button
                  onClick={() => { setShowRejectDialog(false); respond("rejected", rejectionReason); }}
                  disabled={loading === "rejected"}
                  className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading === "rejected" ? "..." : "تأكيد الرفض"}
                </button>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>
      {error && <p className="mt-3 text-xs text-red-600 text-center">{error}</p>}
      <p className="mt-3 text-xs text-center text-[#1D3F1F]/40">
        بالقبول تؤكد موافقتك على السعر والشروط المذكورة
      </p>
    </div>
  );
}

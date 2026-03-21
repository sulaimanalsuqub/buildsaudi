"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center bg-[#F4F3EB] px-6 text-center"
    >
      <div className="max-w-md">
        <p className="text-7xl font-black text-red-400">500</p>
        <h1 className="mt-4 text-2xl font-bold text-[#1D3F1F]">
          حدث خطأ غير متوقع
        </h1>
        <p className="mt-3 text-[#1D3F1F]/60 leading-relaxed">
          نعتذر عن هذا الخطأ. يمكنك المحاولة مجدداً أو العودة للرئيسية.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-[#09B14B] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1D3F1F]"
          >
            حاول مجدداً
          </button>
          <Link
            href="/"
            className="rounded-full border border-[#1D3F1F]/20 px-6 py-3 text-sm font-semibold text-[#1D3F1F] transition-all hover:bg-[#1D3F1F]/5"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

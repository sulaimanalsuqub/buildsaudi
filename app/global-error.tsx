"use client";

import { useEffect } from "react";
import Link from "next/link";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error:", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <div
          dir="rtl"
          className="flex min-h-screen flex-col items-center justify-center bg-brand-light px-6 text-center"
        >
          <div className="max-w-md">
            <p className="text-7xl font-black text-brand-dark">500</p>
            <h1 className="mt-4 text-2xl font-bold text-brand-dark">
              حدث خطأ غير متوقع
            </h1>
            <p className="mt-3 text-brand-dark/60 leading-relaxed">
              نعتذر عن هذا الخطأ. يمكنك المحاولة مجدداً أو العودة للرئيسية.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <button
                onClick={reset}
                className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold text-white"
              >
                حاول مجدداً
              </button>
              <Link
                href="/"
                className="rounded-full border border-brand-dark/20 px-6 py-3 text-sm font-semibold text-brand-dark"
              >
                الرئيسية
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

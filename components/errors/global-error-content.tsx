"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AuroraText } from "@/components/ui/aurora-text";
import { Button } from "@/components/ui/button";

export function GlobalErrorContent({
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
      className="flex min-h-screen flex-col items-center justify-center bg-brand-light px-6 text-center"
    >
      <div className="max-w-md">
        <p className="text-7xl font-black">
          <AuroraText>500</AuroraText>
        </p>
        <h1 className="mt-4 text-2xl font-bold text-brand-dark">
          حدث خطأ غير متوقع
        </h1>
        <p className="mt-3 text-brand-dark/60 leading-relaxed">
          نعتذر عن هذا الخطأ. يمكنك المحاولة مجدداً أو العودة للرئيسية.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset} size="lg" className="rounded-full">
            حاول مجدداً
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link href="/">الرئيسية</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

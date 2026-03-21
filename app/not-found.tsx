import Link from "next/link";

export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center bg-[#F4F3EB] px-6 text-center"
    >
      <div className="max-w-md">
        <p className="text-8xl font-black text-[#09B14B]">404</p>
        <h1 className="mt-4 text-2xl font-bold text-[#1D3F1F]">
          الصفحة غير موجودة
        </h1>
        <p className="mt-3 text-[#1D3F1F]/60 leading-relaxed">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-[#09B14B] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1D3F1F]"
          >
            الرئيسية
          </Link>
          <Link
            href="/get-quote"
            className="rounded-full border border-[#1D3F1F]/20 px-6 py-3 text-sm font-semibold text-[#1D3F1F] transition-all hover:bg-[#1D3F1F]/5"
          >
            اطلب عرض سعر
          </Link>
        </div>
      </div>
    </div>
  );
}

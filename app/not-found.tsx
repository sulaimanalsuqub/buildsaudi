import Link from "next/link";
import { AuroraText } from "@/components/ui/aurora-text";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center bg-brand-light px-6 text-center transition-colors dark:bg-brand-dark"
    >
      <div className="max-w-md">
        <p className="text-8xl font-black">
          <AuroraText>404</AuroraText>
        </p>
        <h1 className="mt-4 text-2xl font-bold text-brand-dark dark:text-brand-light">
          الصفحة غير موجودة
        </h1>
        <p className="mt-3 text-brand-dark/60 leading-relaxed dark:text-brand-light/60">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/">الرئيسية</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link href="/get-quote">اطلب عرض سعر</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#F8FAF7] text-[#1D3F1F]" dir="rtl">
      <header className="border-b border-[#1D3F1F]/10 bg-white">
        <div className="mx-auto flex h-20 w-full max-w-[1120px] items-center justify-between px-5">
          <Image src="/brand/logo-ar.svg" alt="بيلد" width={4302} height={1500} className="h-9 w-auto" priority />
          <span className="rounded-full border border-[#1D3F1F]/10 bg-[#F4F3EB] px-3 py-1 text-xs font-semibold text-[#1D3F1F]/65">
            صيانة مؤقتة
          </span>
        </div>
      </header>

      <section className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-[1120px] px-5 py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#09B14B]">تحديث النظام</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-normal md:text-6xl">
              نعمل على تجهيز تجربة بيلد الجديدة
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#1D3F1F]/62">
              الموقع متوقف مؤقتًا أثناء ربط العمليات مع نظام العمليات. سنعود قريبًا بواجهة أكثر استقرارًا لإدارة الطلبات والموردين.
            </p>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#1D3F1F]/10 bg-white p-4">
                <p className="text-sm font-bold">Odoo</p>
                <p className="mt-1 text-sm text-[#1D3F1F]/55">ربط العمليات</p>
              </div>
              <div className="rounded-xl border border-[#1D3F1F]/10 bg-white p-4">
                <p className="text-sm font-bold">RFQ</p>
                <p className="mt-1 text-sm text-[#1D3F1F]/55">تجهيز الطلبات</p>
              </div>
              <div className="rounded-xl border border-[#1D3F1F]/10 bg-white p-4">
                <p className="text-sm font-bold">KSA</p>
                <p className="mt-1 text-sm text-[#1D3F1F]/55">توريد داخل المملكة</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#1D3F1F]/10 bg-white">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-5 py-5 text-xs text-[#1D3F1F]/45">
          <span>© {new Date().getFullYear()} بيلد</span>
          <span dir="ltr">build.sa</span>
        </div>
      </footer>
    </main>
  );
}

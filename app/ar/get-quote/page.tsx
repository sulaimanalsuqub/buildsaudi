import { Metadata } from "next";

import { GetQuoteForm } from "@/components/forms/get-quote-form";

export const metadata: Metadata = {
  title: "اطلب عرض سعر",
  description: "أرسل تفاصيل مشروعك واستلم عرض سعر شامل من بيلد خلال 24 ساعة.",
};

export default function ArabicGetQuotePage() {
  return (
    <main className="py-10 md:py-16" dir="rtl">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-[28px] font-bold tracking-tight text-brand-dark md:text-[36px]">
            اطلب عرض سعر
          </h1>
          <p className="mt-3 text-base text-brand-dark/60 leading-relaxed md:text-[17px]">
            أرسل تفاصيل مشروعك وسيتواصل معك فريق بيلد خلال 24 ساعة بعرض سعر شامل.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-[20px] border border-brand-dark/10 bg-white p-4 sm:rounded-[24px] sm:p-6 md:p-8">
          <GetQuoteForm isRtl={true} />
        </div>
      </div>
    </main>
  );
}

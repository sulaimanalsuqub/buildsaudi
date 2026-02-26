import { Metadata } from "next";

import { GetQuoteForm } from "@/components/forms/get-quote-form";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Submit your project details and receive a comprehensive price quote from Build.",
};

export default function GetQuotePage() {
  return (
    <main className="py-10 md:py-16">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-[28px] font-bold tracking-tight text-brand-dark md:text-[36px]">
            Request a Quote
          </h1>
          <p className="mt-3 text-base text-brand-dark/60 leading-relaxed md:text-[17px]">
            Send your project details and our team will contact you within 24 hours with a full price quote.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-[24px] border border-brand-dark/10 bg-white p-6 shadow-soft md:p-8">
          <GetQuoteForm isRtl={false} />
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ProcurementRequestForm } from "@/components/forms/procurement-request-form";

export function QuotePageContent({ isRtl = false }: { isRtl?: boolean }) {
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="quote-page min-h-screen bg-brand-light pb-16 pt-7 md:pb-24 md:pt-12">
      <Container>
        <Link href={isRtl ? "/ar" : "/"} className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-brand-dark/75 hover:text-brand-dark"><BackArrow className="h-4 w-4" aria-hidden="true" />{isRtl ? "العودة إلى بيلد" : "Back to Build"}</Link>
        <div className="mx-auto max-w-2xl">
          <div className="min-w-0 rounded-2xl border border-brand-dark/15 bg-white p-5 sm:p-8">
            <div className="mb-8 flex items-center justify-between gap-4 border-b border-brand-dark/15 pb-5"><h2 className="text-lg font-bold">{isRtl ? "طلب عرض سعر" : "Request a quote"}</h2><p className="text-xs text-brand-dark/70">{isRtl ? "* حقول مطلوبة" : "* Required fields"}</p></div>
            <ProcurementRequestForm isRtl={isRtl} />
          </div>
        </div>
      </Container>
    </main>
  );
}

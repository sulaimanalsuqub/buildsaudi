import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ProcurementRequestForm } from "@/components/forms/procurement-request-form";

export function QuotePageContent({ isRtl = false }: { isRtl?: boolean }) {
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="quote-page min-h-screen pb-16 pt-6 md:pb-24 md:pt-10">
      <Container>
        <div className="quote-page-shell mx-auto">
          <Link href={isRtl ? "/ar" : "/"} className="quote-back-link inline-flex min-h-11 items-center gap-2 text-sm hover:underline"><BackArrow className="h-4 w-4" aria-hidden="true" />{isRtl ? "العودة إلى بيلد" : "Back to Build"}</Link>
          <div className="quote-page-intro">
            <h1>{isRtl ? "طلب عرض سعر" : "Request a quote"}</h1>
            <p>{isRtl ? "أضف قائمة المواد وتفاصيل مشروعك، وخلّ ترتيب التوريد علينا." : "Share your materials list and project details. We’ll take care of coordinating the supply."}</p>
          </div>
          <div className="quote-form-surface">
            <p className="quote-required-note">{isRtl ? "* حقول مطلوبة" : "* Required fields"}</p>
            <ProcurementRequestForm isRtl={isRtl} />
          </div>
        </div>
      </Container>
    </main>
  );
}

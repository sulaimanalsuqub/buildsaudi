
import { interfaceCopy } from "@/lib/dictionaries/interface";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ProcurementRequestForm } from "@/components/forms/procurement-request-form";

export function QuotePageContent({ isRtl = false }: { isRtl?: boolean }) {
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  return (
    <main id="main-content" dir={isRtl ? "rtl" : "ltr"} className="quote-page min-h-screen pb-16 pt-6 md:pb-24 md:pt-10">
      <Container>
        <div className="quote-page-shell mx-auto">
          <Link href={isRtl ? "/ar" : "/"} className="quote-back-link inline-flex min-h-11 items-center gap-2 text-sm hover:underline"><BackArrow className="h-4 w-4" aria-hidden="true" />{interfaceCopy(isRtl, "quote_page_content_001")}</Link>
          <div className="quote-page-intro">
            <h1>{interfaceCopy(isRtl, "quote_page_content_002")}</h1>
            <p>{interfaceCopy(isRtl, "quote_page_content_003")}</p>
          </div>
          <div className="quote-form-surface">
            <p className="quote-required-note">{interfaceCopy(isRtl, "quote_page_content_004")}</p>
            <ProcurementRequestForm isRtl={isRtl} />
          </div>
        </div>
      </Container>
    </main>
  );
}

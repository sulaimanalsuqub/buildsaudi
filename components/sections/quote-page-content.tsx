import { Container } from "@/components/ui/container";
import { ProcurementRequestForm } from "@/components/forms/procurement-request-form";

const WHATSAPP_NUMBER = "966553771777";
const WHATSAPP_MESSAGE = "السلام عليكم ورحمة الله وبركاته";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.47 1.33 4.98L2 22l5.2-1.36a9.9 9.9 0 0 0 4.84 1.23h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2Zm0 18.2h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.09.81.82-3-.2-.31a8.23 8.23 0 0 1-1.26-4.4c0-4.55 3.7-8.25 8.25-8.25 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.42 5.83c0 4.55-3.71 8.23-8.27 8.23Zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.99-1.22a7.5 7.5 0 0 1-1.37-1.71c-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.24-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.16 0-.43.06-.66.31-.23.24-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.68 4.25 3.75.59.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.19.2-.58.2-1.08.14-1.19-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}

type QuotePageContentProps = {
  isRtl?: boolean;
};

export function QuotePageContent({ isRtl = false }: QuotePageContentProps) {
  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-brand-light pb-16">
      <Container>
        <header className="pb-8 pt-10 md:pb-10 md:pt-14">
          <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-brand-dark/60">
            <span className="h-2 w-2 bg-brand-primary" aria-hidden="true" />
            {isRtl ? "طلب عرض سعر" : "Request a quote"}
          </p>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="type-hero text-brand-dark">{isRtl ? "وش يحتاج مشروعك؟" : "What does your project need?"}</h1>
              <p className="type-body mt-3 max-w-xl text-brand-dark/65">{isRtl ? "أرفق طلبك أو اكتب احتياجاتك. نراجع التفاصيل ونجهّز لك عرض السعر." : "Attach your request or tell us what you need. We’ll review the details and prepare your quote."}</p>
            </div>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-brand-dark/15 px-4 py-3 text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:bg-white md:self-auto">
              <WhatsAppIcon className="h-5 w-5 text-brand-primary" />
              {isRtl ? "نساعدك على واتساب" : "Get help on WhatsApp"}
            </a>
          </div>
        </header>
        <ProcurementRequestForm isRtl={isRtl} />
      </Container>
    </main>
  );
}

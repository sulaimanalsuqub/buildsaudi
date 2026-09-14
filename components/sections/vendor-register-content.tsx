import { VendorRegistrationForm } from "@/components/forms/vendor-registration-form";
import { Container } from "@/components/ui/container";

type VendorRegisterContentProps = {
  isRtl?: boolean;
};

export function VendorRegisterContent({ isRtl = false }: VendorRegisterContentProps) {
  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-white py-14 md:py-20">
      <Container>
        <div id="supplier-registration-form" className="mx-auto w-full max-w-xl scroll-mt-28">
          <VendorRegistrationForm isRtl={isRtl} />
        </div>
      </Container>
    </main>
  );
}

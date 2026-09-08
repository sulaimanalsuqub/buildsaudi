import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "BANI | قريباً",
  robots: { index: false, follow: true },
};

export default function BaniRegistrationPage() {
  return (
    <main dir="rtl" className="min-h-[60vh] bg-[#f7f9f6] py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-[0.14em] text-brand-primary">✦ BANI</p>
          <h1 className="type-hero mt-5 text-brand-dark">قريباً</h1>
          <Link href="/ar/register" className="mt-8 inline-flex rounded-full bg-brand-primary px-6 py-3 font-semibold text-white">
            العودة لتسجيل الموردين
          </Link>
        </div>
      </Container>
    </main>
  );
}

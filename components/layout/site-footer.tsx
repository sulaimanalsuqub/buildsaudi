import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/container";

type SiteFooterProps = {
  isRtl?: boolean;
};

export function SiteFooter({ isRtl = false }: SiteFooterProps) {
  const legalBase = isRtl ? "/ar" : "";

  return (
    <footer className="mt-10 border-t border-brand-dark/10 bg-white/60 md:mt-14">
      <Container className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Image
            src={isRtl ? "/brand/logo-ar.svg" : "/brand/logo-en.svg"}
            alt={isRtl ? "شعار بيلد" : "Build logo"}
            width={4302}
            height={1500}
            className="h-[28px] w-auto"
          />
          <p className="text-sm text-brand-dark/55">
            {isRtl ? "موقع بيلد للموردين" : "Build supplier site"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-brand-dark/65">
          <Link href={`${legalBase}/privacy-policy`} className="transition hover:text-brand-dark">
            {isRtl ? "الخصوصية" : "Privacy"}
          </Link>
          <Link href={`${legalBase}/terms-conditions`} className="transition hover:text-brand-dark">
            {isRtl ? "الشروط" : "Terms"}
          </Link>
          <Link href={`${legalBase}/cookies-policy`} className="transition hover:text-brand-dark">
            {isRtl ? "الكوكيز" : "Cookies"}
          </Link>
        </div>
      </Container>
    </footer>
  );
}

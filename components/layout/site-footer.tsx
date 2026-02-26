import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/container";

type SiteFooterProps = {
  isRtl?: boolean;
};

export function SiteFooter({ isRtl = false }: SiteFooterProps) {
  const legalBase = isRtl ? "/ar" : "";

  return (
    <footer className="mt-10 border-t border-brand-dark/10 bg-transparent md:mt-14">
      <Container className="content-stack py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <Image
              src={isRtl ? "/brand/logo-ar.svg" : "/brand/logo-en.svg"}
              alt={isRtl ? "شعار بيلد" : "Build logo"}
              width={4302}
              height={1500}
              className="h-[30px] w-auto"
            />
          </div>
          <div className="flex flex-wrap items-center gap-6 type-small text-brand-dark/70">
            <Link href={isRtl ? "/ar/register" : "/register"} className="transition-colors hover:text-brand-dark">{isRtl ? "سجل كمورد" : "Register as Vendor"}</Link>
            <Link href={`${legalBase}/privacy-policy`} className="transition-colors hover:text-brand-dark">{isRtl ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
            <Link href={`${legalBase}/terms-conditions`} className="transition-colors hover:text-brand-dark">{isRtl ? "الشروط والأحكام" : "Terms & Conditions"}</Link>
            <Link href={`${legalBase}/cookies-policy`} className="transition-colors hover:text-brand-dark">{isRtl ? "سياسة ملفات الارتباط" : "Cookies Policy"}</Link>
          </div>
        </div>
        <p className="type-small text-brand-dark/55">
          {isRtl
            ? "© 2026 بيلد. جميع الحقوق محفوظة."
            : "© 2026 Build Saudi. All rights reserved."}
        </p>
      </Container>
    </footer>
  );
}

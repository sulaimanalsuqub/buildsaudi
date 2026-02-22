import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/container";

type SiteFooterProps = {
  isRtl?: boolean;
};

export function SiteFooter({ isRtl = false }: SiteFooterProps) {
  return (
    <footer className="mt-24 border-t border-brand-dark/10 bg-white">
      <Container className="space-y-8 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/brand/icon-mark.svg" alt="Build icon" width={30} height={30} />
            <Image
              src={isRtl ? "/brand/logo-ar.svg" : "/brand/logo-en.svg"}
              alt={isRtl ? "شعار بيلد" : "Build logo"}
              width={isRtl ? 124 : 106}
              height={36}
            />
          </div>
          <div className="flex flex-wrap items-center gap-5 text-sm text-brand-dark/80">
            <Link href="/privacy-policy" className="hover:text-brand-primary">{isRtl ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
            <Link href="/terms-conditions" className="hover:text-brand-primary">{isRtl ? "الشروط والأحكام" : "Terms & Conditions"}</Link>
            <Link href="/cookies-policy" className="hover:text-brand-primary">{isRtl ? "سياسة ملفات الارتباط" : "Cookies Policy"}</Link>
          </div>
        </div>
        <p className="text-sm text-brand-dark/60">
          {isRtl
            ? "© 2026 بيلد. جميع الحقوق محفوظة."
            : "© 2026 Build Saudi. All rights reserved."}
        </p>
      </Container>
    </footer>
  );
}

import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/container";

type SiteHeaderProps = {
  isRtl?: boolean;
};

export function SiteHeader({ isRtl = false }: SiteHeaderProps) {
  const homeHref = isRtl ? "/ar" : "/";

  const registerHref = isRtl ? "/ar/register" : "/register";
  const languageHref = isRtl ? "/" : "/ar";

  return (
    <header className="sticky top-0 z-40 border-b border-brand-dark/10 bg-white/95">
      <Container className="flex h-16 items-center justify-between md:h-[72px]">
        <Link href={homeHref} className="flex items-center gap-3" aria-label="Build homepage">
          <Image
            src={isRtl ? "/brand/logo-ar.svg" : "/brand/logo-en.svg"}
            alt={isRtl ? "شعار بيلد" : "Build logo"}
            width={isRtl ? 140 : 120}
            height={40}
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href={languageHref}
            className="rounded-full border border-brand-dark/20 px-4 py-2 text-sm font-medium text-brand-dark transition hover:border-brand-dark/35"
          >
            {isRtl ? "EN" : "ع"}
          </Link>
          <Link
            href={registerHref}
            className="rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark/90"
          >
            {isRtl ? "سجل كمورد" : "Register Vendor"}
          </Link>
        </div>
      </Container>
    </header>
  );
}

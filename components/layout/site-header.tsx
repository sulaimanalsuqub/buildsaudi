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
    <header className="sticky top-0 z-40 border-b border-brand-dark/10 bg-white/95 backdrop-blur-sm">
      <Container className="flex h-[74px] items-center justify-between">
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
            className="rounded-full border border-brand-dark/20 px-4 py-2 type-small font-semibold text-brand-dark transition-colors hover:border-brand-dark/35 hover:bg-brand-dark/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark/20"
          >
            {isRtl ? "EN" : "ع"}
          </Link>
          <Link
            href={registerHref}
            className="rounded-full bg-brand-primary px-5 py-2.5 type-button text-white transition-colors hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35"
          >
            {isRtl ? "ابدأ التوريد" : "Start Supplying"}
          </Link>
        </div>
      </Container>
    </header>
  );
}

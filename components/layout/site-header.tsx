import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/container";

type SiteHeaderProps = {
  isRtl?: boolean;
};

export function SiteHeader({ isRtl = false }: SiteHeaderProps) {
  const homeHref = isRtl ? "/ar" : "/";
  const navItems = [
    { label: isRtl ? "المزايا" : "Features", href: `${homeHref}#features` },
    { label: isRtl ? "كيف تعمل" : "How It Works", href: `${homeHref}#how-it-works` },
    { label: isRtl ? "ثقة العملاء" : "Trust", href: `${homeHref}#trust` }
  ];

  const registerHref = isRtl ? "/ar/register" : "/register";
  const languageHref = isRtl ? "/" : "/ar";

  return (
    <header className="sticky top-0 z-40 border-b border-brand-dark/10 bg-white/85 backdrop-blur-xl">
      <Container className="flex h-20 items-center justify-between">
        <Link href={homeHref} className="flex items-center gap-3" aria-label="Build homepage">
          <Image src="/brand/icon-mark.svg" alt="Build icon" width={34} height={34} priority />
          <Image
            src={isRtl ? "/brand/logo-ar.svg" : "/brand/logo-en.svg"}
            alt={isRtl ? "شعار بيلد" : "Build logo"}
            width={isRtl ? 140 : 120}
            height={40}
            priority
          />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href + item.label} href={item.href} className="text-sm font-medium text-brand-dark transition-colors hover:text-brand-primary">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={languageHref}
            className="rounded-full border border-brand-dark/20 px-4 py-2 text-sm font-medium text-brand-dark transition hover:border-brand-primary hover:text-brand-primary"
          >
            {isRtl ? "EN" : "ع"}
          </Link>
          <Link
            href={registerHref}
            className="rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary"
          >
            {isRtl ? "سجل كمورد" : "Register Vendor"}
          </Link>
        </div>
      </Container>
    </header>
  );
}

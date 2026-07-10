"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";

import { Container } from "@/components/ui/container";

type SiteHeaderProps = {
  isRtl?: boolean;
};

/** يحوّل المسار بين العربية والإنجليزية مع الحفاظ على الصفحة الحالية */
export function alternateLocalePath(pathname: string): string {
  const path = pathname || "/";

  if (path === "/ar" || path === "/ar/") {
    return "/";
  }
  if (path.startsWith("/ar/")) {
    const rest = path.slice(3);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  if (path === "/") {
    return "/ar";
  }
  return `/ar${path.startsWith("/") ? path : `/${path}`}`;
}

export function SiteHeader({ isRtl = false }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const homeHref = isRtl ? "/ar" : "/";
  const altPath = alternateLocalePath(pathname);
  const query = searchParams?.toString() ?? "";
  const languageHref = query ? `${altPath}?${query}` : altPath;

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 border-b border-brand-dark/8 bg-white/92 backdrop-blur-xl transition-all duration-300",
        scrolled ? "border-b border-brand-dark/10 shadow-sm" : "",
      ].join(" ")}
    >
      <Container className="flex h-[72px] items-center justify-between gap-4">
        <Link href={homeHref} aria-label={isRtl ? "الصفحة الرئيسية" : "Build homepage"}>
          <Image
            src={isRtl ? "/brand/logo-ar.svg" : "/brand/logo-en.svg"}
            alt={isRtl ? "شعار بيلد" : "Build logo"}
            width={4302}
            height={1500}
            priority
            className="h-14 w-auto"
          />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={languageHref}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-dark/12 bg-white text-brand-dark/70 transition hover:border-brand-dark/25 hover:text-brand-dark"
            aria-label={isRtl ? "English" : "العربية"}
            title={isRtl ? "English" : "العربية"}
          >
            <Languages className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </header>
  );
}

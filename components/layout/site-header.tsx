"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Languages } from "lucide-react";

import { Container } from "@/components/ui/container";

type SiteHeaderProps = {
  isRtl?: boolean;
};

export function SiteHeader({ isRtl = false }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const homeHref = isRtl ? "/ar" : "/";
  const languageHref = isRtl ? "/" : "/ar";
  const registerHref = isRtl ? "/ar/register" : "/register";

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 border-b border-brand-dark/8 bg-white/92 backdrop-blur-xl transition-all duration-300",
        scrolled ? "shadow-[0_4px_24px_rgba(29,63,31,0.07)]" : "",
      ].join(" ")}
    >
      <Container className="flex h-[68px] items-center justify-between gap-4">
        <Link href={homeHref} aria-label={isRtl ? "الصفحة الرئيسية" : "Build homepage"}>
          <Image
            src={isRtl ? "/brand/logo-ar.svg" : "/brand/logo-en.svg"}
            alt={isRtl ? "شعار بيلد" : "Build logo"}
            width={4302}
            height={1500}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" dir={isRtl ? "rtl" : "ltr"}>
          <Link
            href={isRtl ? "/ar/get-quote" : "/get-quote"}
            className="text-sm font-semibold text-brand-dark/60 transition hover:text-brand-dark"
          >
            {isRtl ? "أطلب المنتجات" : "Order Products"}
          </Link>
          <Link
            href={isRtl ? "/ar/register" : "/register"}
            className="text-sm font-semibold text-brand-dark/60 transition hover:text-brand-dark"
          >
            {isRtl ? "كُن موردًا" : "Become a Supplier"}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={languageHref}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-dark/12 bg-white text-brand-dark/70 transition hover:border-brand-dark/25 hover:text-brand-dark"
            aria-label={isRtl ? "English" : "العربية"}
          >
            <Languages className="h-4 w-4" />
          </Link>
          <Link
            href={registerHref}
            className="inline-flex h-9 items-center justify-center rounded-full bg-brand-dark px-5 text-sm font-bold text-white transition hover:bg-brand-primary"
          >
            {isRtl ? "سجّل كمورد" : "Register"}
          </Link>
        </div>
      </Container>
    </header>
  );
}

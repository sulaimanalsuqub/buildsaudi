"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/70 shadow-[0_2px_24px_rgba(29,63,31,0.08)] backdrop-blur-2xl"
          : "bg-white/30 backdrop-blur-md",
        "border-b border-white/40",
      ].join(" ")}
    >
      <Container className="flex h-[68px] items-center justify-between">
        <Link href={homeHref} aria-label={isRtl ? "الصفحة الرئيسية" : "Build homepage"}>
          <Image
            src={isRtl ? "/brand/logo-ar.svg" : "/brand/logo-en.svg"}
            alt={isRtl ? "شعار بيلد" : "Build logo"}
            width={4302}
            height={1500}
            priority
            className="h-[32px] w-auto"
          />
        </Link>

        <Link
          href={languageHref}
          className="rounded-full border border-brand-dark/20 bg-white/60 px-4 py-1.5 text-xs font-semibold text-brand-dark backdrop-blur-sm transition-all hover:bg-white/80 hover:border-brand-dark/35"
        >
          {isRtl ? "EN" : "ع"}
        </Link>
      </Container>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type SiteHeaderProps = {
  isRtl?: boolean;
};

export function SiteHeader({ isRtl = false }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const homeHref = isRtl ? "/ar" : "/";
  const languageHref = isRtl ? "/" : "/ar";

  return (
    <div className="fixed top-0 inset-x-0 z-40 flex justify-center pointer-events-none">
      <header
        className={[
          "pointer-events-auto w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8",
          "transition-all duration-300 ease-in-out",
          scrolled
            ? "mt-2 rounded-[26px] bg-white/55 backdrop-blur-xl border border-brand-dark/10"
            : "mt-0 rounded-none bg-white/55 backdrop-blur-md border-b border-brand-dark/10",
        ].join(" ")}
      >
        <div
          className={[
            "flex items-center justify-between transition-all duration-300",
            scrolled ? "h-[46px] md:h-[56px]" : "h-[52px] md:h-[64px]",
          ].join(" ")}
        >
          {/* Logo */}
          <Link href={homeHref} aria-label={isRtl ? "الصفحة الرئيسية" : "Build homepage"}>
            <Image
              src={isRtl ? "/brand/logo-ar.svg" : "/brand/logo-en.svg"}
              alt={isRtl ? "شعار بيلد" : "Build logo"}
              width={isRtl ? 130 : 110}
              height={36}
              priority
              className={[
                "transition-all duration-300",
                scrolled ? "h-[28px] md:h-[32px]" : "h-[32px] md:h-[36px]",
                "w-auto",
              ].join(" ")}
            />
          </Link>

          {/* Language pill */}
          <Link
            href={languageHref}
            className={[
              "rounded-full border border-brand-dark/20 font-semibold text-brand-dark",
              "transition-all duration-300 hover:border-brand-dark/35 hover:bg-brand-dark/[0.04]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark/20",
              scrolled ? "px-3 py-1 text-[11px]" : "px-4 py-1.5 text-xs",
            ].join(" ")}
          >
            {isRtl ? "EN" : "ع"}
          </Link>
        </div>
      </header>
    </div>
  );
}

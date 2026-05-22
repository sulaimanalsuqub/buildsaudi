"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Languages, LayoutDashboard, ShoppingBag, Store } from "lucide-react";

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
  const quoteHref = isRtl ? "/ar/get-quote" : "/get-quote";
  const registerHref = isRtl ? "/ar/register" : "/register";
  const nav = [
    { href: quoteHref, label: isRtl ? "اطلب المنتجات" : "Order Products", icon: ShoppingBag },
    { href: registerHref, label: isRtl ? "كُن موردًا" : "Become a Supplier", icon: Store },
    { href: "/admin", label: isRtl ? "لوحة الإدارة" : "Admin", icon: LayoutDashboard },
  ];

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-brand-dark/10 bg-white/[0.88] shadow-soft backdrop-blur-2xl"
          : "border-transparent bg-white/[0.74] backdrop-blur-xl",
        "border-b",
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
            className="h-[38px] w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-brand-dark/10 bg-white/[0.78] p-1 shadow-soft md:flex">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-brand-dark/72 transition hover:bg-brand-light hover:text-brand-dark"
              >
                <Icon className="h-4 w-4 text-brand-primary" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={languageHref}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-dark/15 bg-white text-sm font-bold text-brand-dark transition hover:border-brand-dark/30"
            aria-label={isRtl ? "English" : "العربية"}
          >
            <Languages className="h-4 w-4" />
          </Link>
          <Link
            href={registerHref}
            className="hidden h-10 items-center justify-center rounded-full bg-brand-dark px-5 text-sm font-bold text-white transition hover:bg-brand-primary sm:inline-flex"
          >
            {isRtl ? "انضم كمورد" : "Join as Supplier"}
          </Link>
        </div>
      </Container>
    </header>
  );
}

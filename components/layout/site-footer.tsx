import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";

import { Container } from "@/components/ui/container";

const SUPPORT_EMAIL = "cs@build.sa";

type SiteFooterProps = {
  isRtl?: boolean;
};

export function SiteFooter({ isRtl = false }: SiteFooterProps) {
  const legalBase = isRtl ? "/ar" : "";
  const year = new Date().getFullYear();
  const links = {
    main: [
      { href: isRtl ? "/ar" : "/", label: isRtl ? "الرئيسية" : "Home" },
      { href: isRtl ? "/ar/get-quote" : "/get-quote", label: isRtl ? "أطلب المنتجات" : "Order Products" },
      { href: isRtl ? "/ar/register" : "/register", label: isRtl ? "كُن موردًا" : "Become a Supplier" },
    ],
    legal: [
      { href: `${legalBase}/privacy-policy`, label: isRtl ? "سياسة الخصوصية" : "Privacy Policy" },
      { href: `${legalBase}/terms-conditions`, label: isRtl ? "الشروط والأحكام" : "Terms & Conditions" },
      { href: `${legalBase}/cookies-policy`, label: isRtl ? "سياسة الكوكيز" : "Cookies Policy" },
    ],
  };

  return (
    <footer className="border-t border-brand-dark/8 bg-[#f7f9f6]">
      <Container className="py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.6fr)_minmax(140px,0.7fr)_minmax(180px,0.8fr)]">
          {/* Brand column */}
          <div className="max-w-xs">
            <Image
              src={isRtl ? "/brand/logo-ar.svg" : "/brand/logo-en.svg"}
              alt={isRtl ? "شعار بيلد" : "Build logo"}
              width={4302}
              height={1500}
              className="h-8 w-auto"
            />
            <p className="mt-4 text-sm leading-[1.8] text-brand-dark/58">
              {isRtl
                ? "توريد مواد البناء أسرع وأسهل"
                : "Build supplies building materials for construction projects across Riyadh, Jeddah, and Saudi Arabia. Steel, cement, and finishing materials delivered to your project site."}
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:border-brand-primary/40 hover:text-brand-primary"
              dir="ltr"
            >
              <Mail className="h-4 w-4 text-brand-primary" />
              {SUPPORT_EMAIL}
            </a>
          </div>

          <FooterColumn title={isRtl ? "الموقع" : "Site"} links={links.main} />
          <FooterColumn title={isRtl ? "السياسات" : "Policies"} links={links.legal} />
        </div>

        <div className="mt-10 border-t border-brand-dark/8 pt-6 text-xs text-brand-dark/45">
          <p>{isRtl ? `© ${year} بيلد. جميع الحقوق محفوظة.` : `© ${year} Build. All rights reserved.`}</p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="text-sm font-bold text-brand-dark">{title}</h2>
      <div className="mt-4 grid gap-3 text-sm font-medium text-brand-dark/62">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="transition hover:text-brand-primary">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

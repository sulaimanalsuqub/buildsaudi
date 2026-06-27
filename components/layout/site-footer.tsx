import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/container";

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
                ? "بيلد مورد مواد بناء للمشاريع الإنشائية في الرياض وجدة وجميع مناطق المملكة. توريد حديد وإسمنت ومواد التشطيب مع التسليم لموقع المشروع."
                : "Build supplies building materials for construction projects across Riyadh, Jeddah, and Saudi Arabia. Steel, cement, and finishing materials delivered to your project site."}
            </p>
          </div>

          <FooterColumn title={isRtl ? "الموقع" : "Site"} links={links.main} />
          <FooterColumn title={isRtl ? "السياسات" : "Policies"} links={links.legal} />
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-brand-dark/8 pt-6 text-xs text-brand-dark/45 md:flex-row md:items-center md:justify-between">
          <p>{isRtl ? `© ${year} بيلد. جميع الحقوق محفوظة.` : `© ${year} Build. All rights reserved.`}</p>
          <p>{isRtl ? "توريد مشاريع البناء في المملكة العربية السعودية" : "Construction procurement · Saudi Arabia"}</p>
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

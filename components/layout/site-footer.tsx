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
    <footer className="mt-12 border-t border-brand-dark/10 bg-[#f8faf7] md:mt-16">
      <Container className="py-10 md:py-12">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.5fr)_minmax(150px,0.7fr)_minmax(190px,0.8fr)]">
          <div className="max-w-md">
            <Image
              src={isRtl ? "/brand/logo-ar.svg" : "/brand/logo-en.svg"}
              alt={isRtl ? "شعار بيلد" : "Build logo"}
              width={4302}
              height={1500}
              className="h-[34px] w-auto"
            />
            <p className="mt-4 text-sm leading-7 text-brand-dark/62">
              {isRtl
                ? "بيلد شريك توريد لمواد البناء، يستقبل طلبات المشاريع ويدير علاقات الموردين ودورة الشراء من خلال ERPNext."
                : "Build is a procurement partner for construction materials, managing project requests, supplier relationships, and the purchasing cycle through ERPNext."}
            </p>
          </div>

          <FooterColumn title={isRtl ? "الموقع" : "Site"} links={links.main} />
          <FooterColumn title={isRtl ? "السياسات" : "Policies"} links={links.legal} />
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-brand-dark/10 pt-5 text-sm text-brand-dark/55 md:flex-row md:items-center md:justify-between">
          <p>{isRtl ? `© ${year} بيلد. جميع الحقوق محفوظة.` : `© ${year} Build. All rights reserved.`}</p>
          <p>{isRtl ? "تشغيل وتوريد مشاريع البناء" : "Construction procurement operations"}</p>
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

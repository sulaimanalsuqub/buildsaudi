import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Building2, Mail, MapPin } from "lucide-react";

import { Container } from "@/components/ui/container";

type SiteFooterProps = {
  isRtl?: boolean;
};

export function SiteFooter({ isRtl = false }: SiteFooterProps) {
  const legalBase = isRtl ? "/ar" : "";
  const columns = [
    {
      title: isRtl ? "المنصة" : "Platform",
      links: [
        { href: isRtl ? "/ar/get-quote" : "/get-quote", label: isRtl ? "اطلب المنتجات" : "Order Products" },
        { href: isRtl ? "/ar/register" : "/register", label: isRtl ? "كُن موردًا" : "Become a Supplier" },
        { href: "/admin", label: isRtl ? "لوحة الإدارة" : "Admin" },
      ],
    },
    {
      title: isRtl ? "السياسات" : "Policies",
      links: [
        { href: `${legalBase}/privacy-policy`, label: isRtl ? "سياسة الخصوصية" : "Privacy Policy" },
        { href: `${legalBase}/terms-conditions`, label: isRtl ? "الشروط والأحكام" : "Terms & Conditions" },
        { href: `${legalBase}/cookies-policy`, label: isRtl ? "ملفات الارتباط" : "Cookies Policy" },
      ],
    },
  ];

  return (
    <footer className="mt-12 border-t border-brand-dark/10 bg-white/70 md:mt-18">
      <Container className="py-10 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <Image
              src={isRtl ? "/brand/logo-ar.svg" : "/brand/logo-en.svg"}
              alt={isRtl ? "شعار بيلد" : "Build logo"}
              width={4302}
              height={1500}
              className="h-[34px] w-auto"
            />
            <p className="mt-4 max-w-md text-sm leading-7 text-brand-dark/62">
              {isRtl
                ? "منصة سعودية لتوريد مواد البناء وربط المشاريع بالموردين المناسبين عبر تجربة واضحة وسريعة."
                : "A Saudi construction supply platform connecting projects with qualified material suppliers through a clearer workflow."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-brand-dark/70">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1.5">
                <MapPin className="h-4 w-4 text-brand-primary" />
                {isRtl ? "السعودية" : "Saudi Arabia"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1.5">
                <Building2 className="h-4 w-4 text-brand-primary" />
                B2B
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1.5">
                <Mail className="h-4 w-4 text-brand-primary" />
                {isRtl ? "توريد مشاريع" : "Project sourcing"}
              </span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="text-sm font-bold text-brand-dark">{column.title}</h2>
                <div className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-2 text-sm font-medium text-brand-dark/62 transition hover:text-brand-dark"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-brand-dark/10 pt-5">
          <p className="text-sm text-brand-dark/55">
            {isRtl
              ? "© 2026 بيلد. جميع الحقوق محفوظة."
              : "© 2026 Build Saudi. All rights reserved."}
          </p>
        </div>
      </Container>
    </footer>
  );
}

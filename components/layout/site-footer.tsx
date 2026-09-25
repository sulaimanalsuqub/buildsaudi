import Image from "next/image";
import Link from "next/link";
import { Instagram, Linkedin, Mail, MessageCircle, Truck, X as XIcon } from "lucide-react";

import { Grid } from "@/components/ui/grid";

const SUPPORT_EMAIL = "cs@build.sa";
const SUPPORT_PHONE_DISPLAY = "0553771777";
const SUPPORT_WHATSAPP_HREF = `https://wa.me/966553771777?text=${encodeURIComponent("هلابيلد")}`;

const SOCIAL_LINKS = [
  { href: "https://www.linkedin.com/company/buildsaudi", label: "LinkedIn", Icon: Linkedin },
  { href: "https://www.instagram.com/buildsaudi", label: "Instagram", Icon: Instagram },
  { href: "https://x.com/buildsaudi", label: "X", Icon: XIcon },
  { href: "https://www.snapchat.com/add/buildsaudi", label: "Snapchat", Icon: SnapchatIcon },
  { href: "https://www.tiktok.com/@buildsaudi", label: "TikTok", Icon: TikTokIcon },
];

function SnapchatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2c2.9 0 4.55 2.02 4.6 4.36l.04 1.98c.02.2.02.2.2.32.13.09.62.31 1.1.5.24.1.5.28.5.6 0 .5-.62.78-1.06.94-.1.04-.1.12-.06.2.1.24.6.9 1.9 1.14.2.04.34.22.3.42-.1.5-1.1.72-1.7.82-.1.02-.16.1-.16.2 0 .16.02.42-.06.62-.1.24-.36.28-.7.28-.4 0-.86-.12-1.4-.12-.7 0-1.1.36-2 1.02-.86.64-1.7 1.24-2.5 1.24s-1.64-.6-2.5-1.24c-.9-.66-1.3-1.02-2-1.02-.54 0-1 .12-1.4.12-.34 0-.6-.04-.7-.28-.08-.2-.06-.46-.06-.62 0-.1-.06-.18-.16-.2-.6-.1-1.6-.32-1.7-.82-.04-.2.1-.38.3-.42 1.3-.24 1.8-.9 1.9-1.14.04-.08.04-.16-.06-.2-.44-.16-1.06-.44-1.06-.94 0-.32.26-.5.5-.6.48-.19.97-.41 1.1-.5.18-.12.18-.12.2-.32l.04-1.98C7.45 4.02 9.1 2 12 2Z"/>
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.5 2h-3v13.6a2.9 2.9 0 1 1-2.4-2.86v-3.05A5.95 5.95 0 0 0 5 15.7 5.95 5.95 0 0 0 11 21.6a5.95 5.95 0 0 0 5.5-5.9V8.5a8.4 8.4 0 0 0 4.5 1.3v-3a5.4 5.4 0 0 1-4.5-4.8Z"/>
    </svg>
  );
}

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
      { href: isRtl ? "/ar/track-request" : "/track-request", label: isRtl ? "تتبع طلبك" : "Track Your Request" },
    ],
    legal: [
      { href: `${legalBase}/privacy-policy`, label: isRtl ? "سياسة الخصوصية" : "Privacy Policy" },
      { href: `${legalBase}/terms-conditions`, label: isRtl ? "الشروط والأحكام" : "Terms & Conditions" },
      { href: `${legalBase}/cookies-policy`, label: isRtl ? "سياسة الكوكيز" : "Cookies Policy" },
    ],
  };

  return (
    <footer className="border-t border-brand-dark/10 bg-white pt-[var(--space-compact)]">
      {/* شريط "نحن هنا لمساعدتك" مع وسائل التواصل */}
      <Grid>
        <div className="col-span-4 flex flex-col items-center gap-4 pb-8 text-center sm:col-span-8 sm:flex-row sm:justify-center lg:col-span-12">
          <p className="type-body font-semibold text-brand-dark">
            {isRtl ? "نحن هنا لمساعدتك!" : "We're here to help!"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              dir="ltr"
              className="inline-flex items-center gap-2 rounded-full border border-brand-dark/10 px-4 py-2 type-body font-semibold text-brand-dark transition hover:border-brand-primary/40 hover:text-brand-primary"
            >
              <Mail className="h-4 w-4 text-brand-primary" aria-hidden="true" />
              {SUPPORT_EMAIL}
            </a>
            <a
              href={SUPPORT_WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className="inline-flex items-center gap-2 rounded-full border border-[#25D366]/35 px-4 py-2 type-body font-semibold text-brand-dark transition hover:border-[#25D366] hover:bg-[#25D366]/10"
            >
              <MessageCircle className="h-4 w-4 text-[#20b957]" aria-hidden="true" />
              {SUPPORT_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </Grid>

      {/* وعد التوصيل خلال 48 ساعة */}
      <div className="border-t border-brand-dark/10 bg-brand-primary/5">
        <Grid>
          <div className="col-span-4 flex items-center justify-center gap-2 py-4 text-brand-primary sm:col-span-8 lg:col-span-12">
            <Truck className="h-4 w-4" aria-hidden="true" />
            <p className="type-body font-semibold">
              {isRtl
                ? "توصيل خلال 48 ساعة لأي مكان في المملكة العربية السعودية"
                : "Delivery within 48 hours, anywhere in Saudi Arabia"}
            </p>
          </div>
        </Grid>
      </div>

      {/* أعمدة الصفحات المهمة والسياسات */}
      <div className="border-t border-brand-dark/10 pt-[var(--space-compact)]">
        <Grid>
          <div className="col-span-2 sm:col-span-3 lg:col-span-4">
            <FooterColumn title={isRtl ? "الصفحات المهمة" : "Important Pages"} links={links.main} />
          </div>
          <div className="col-span-2 sm:col-span-3 lg:col-span-4">
            <FooterColumn title={isRtl ? "السياسات" : "Policies"} links={links.legal} />
          </div>
          <div className="col-span-4 mt-8 sm:col-span-2 sm:mt-0 lg:col-span-4">
            <p className="type-micro text-brand-dark/40">{isRtl ? "عن بيلد" : "About Us"}</p>
            <p className="type-body mt-4 max-w-xs text-brand-dark/60">
              {isRtl
                ? "المملكة العربية السعودية، جدة، حي الزهراء"
                : "Al Zahra District, Jeddah, Saudi Arabia"}
            </p>
          </div>
        </Grid>
      </div>

      {/* الشعار وحقوق النشر ووسائل التواصل */}
      <div className="mt-16 border-t border-brand-dark/10">
        <Grid>
          <div className="col-span-4 flex flex-col items-center justify-between gap-4 py-6 sm:col-span-8 sm:flex-row lg:col-span-12">
            <Image
              src={isRtl ? "/brand/logo-ar.svg" : "/brand/logo-en.svg"}
              alt={isRtl ? "شعار بيلد" : "Build logo"}
              width={4302}
              height={1500}
              className="h-7 w-auto"
            />
            <p className="type-micro text-brand-dark/40">
              {isRtl ? `© ${year} بيلد. جميع الحقوق محفوظة.` : `© ${year} Build. All rights reserved.`}
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-dark/10 text-brand-dark/55 transition hover:border-brand-primary/40 hover:text-brand-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </Grid>
      </div>
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
      <p className="type-micro text-brand-dark/40">{title}</p>
      <div className="mt-4 grid gap-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="type-body text-brand-dark/70 transition hover:text-brand-primary">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}


import { interfaceCopy } from "@/lib/dictionaries/interface";
import Image from "next/image";
import Link from "next/link";
import { Instagram, Linkedin, Mail, MessageCircle, X as XIcon } from "lucide-react";

import { Grid } from "@/components/ui/grid";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button";
import { WarrantySeal } from "@/components/ui/warranty-seal";

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
      { href: `${legalBase}/about`, label: interfaceCopy(isRtl, "site_footer_001") },
      { href: isRtl ? "/ar/get-quote" : "/get-quote", label: interfaceCopy(isRtl, "site_footer_002") },
      { href: isRtl ? "/ar/register" : "/register", label: interfaceCopy(isRtl, "site_footer_003") },
    ],
    legal: [
      { href: `${legalBase}/#how-it-works`, label: interfaceCopy(isRtl, "site_footer_004") },
      { href: `${legalBase}/warranty`, label: interfaceCopy(isRtl, "site_footer_005") },
      { href: `${legalBase}/privacy-policy`, label: interfaceCopy(isRtl, "site_footer_006") },
      { href: `${legalBase}/terms-conditions`, label: interfaceCopy(isRtl, "site_footer_007") },
      { href: `${legalBase}/cookies-policy`, label: interfaceCopy(isRtl, "site_footer_008") },
    ],
  };

  return (
    <footer dir={isRtl ? "rtl" : "ltr"} className="site-footer relative bg-[var(--color-paper)] pt-14 text-[var(--color-ink)] md:pt-16">
      <Grid className="gap-y-10 md:gap-y-14">
        <div className="col-span-4 sm:col-span-8 lg:col-span-4">
          <Link prefetch={false} href={isRtl ? "/ar" : "/"} aria-label={interfaceCopy(isRtl, "site_footer_009")} className="inline-block">
            <Image src={isRtl ? "/brand/logo-ar.png" : "/brand/logo-en.png"} alt={interfaceCopy(isRtl, "site_footer_010")} width={isRtl ? 2883 : 2846} height={isRtl ? 1231 : 1287} className="h-auto w-36 md:w-40" />
          </Link>
          <p className="mt-5 max-w-xs text-base leading-8 text-[var(--color-muted)]">{interfaceCopy(isRtl, "site_footer_011")}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {SOCIAL_LINKS.map(({ href, label, Icon }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-soft)]"><Icon className="h-4 w-4" aria-hidden="true" /></a>)}
          </div>
        </div>
        <div className="col-span-2 sm:col-span-4 lg:col-span-2"><FooterColumn title={interfaceCopy(isRtl, "site_footer_013")} links={links.main} /></div>
        <div className="col-span-2 sm:col-span-4 lg:col-span-2"><FooterColumn title={interfaceCopy(isRtl, "site_footer_014")} links={links.legal} /></div>
        <div className="col-span-4 sm:col-span-8 lg:col-span-4">
          <h2 className="text-sm font-bold">{interfaceCopy(isRtl, "site_footer_015")}</h2>
          <a href={SUPPORT_WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" dir="ltr" className="mt-5 flex min-h-11 w-fit items-center gap-3 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:underline"><MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{SUPPORT_PHONE_DISPLAY}</a>
          <a href={`mailto:${SUPPORT_EMAIL}`} dir="ltr" className="mt-2 flex min-h-11 w-fit items-center gap-3 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:underline"><Mail className="h-4 w-4 shrink-0" aria-hidden="true" />{SUPPORT_EMAIL}</a>
          <Link prefetch={false} href={`${legalBase}/warranty`} className="mt-5 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-[var(--color-ink)] hover:underline">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)]"><WarrantySeal className="h-6 w-auto" /></span>
            {interfaceCopy(isRtl, "site_footer_012")}
          </Link>
        </div>
        <div className="col-span-4 mt-1 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-line)] py-5 pe-16 text-xs leading-6 text-[var(--color-muted)] sm:col-span-8 lg:col-span-12">
          <p>{isRtl ? `© ${year} بيلد. جميع الحقوق محفوظة.` : `© ${year} Build. All rights reserved.`}</p>
          <Link prefetch={false} href={isRtl ? "/ar/register" : "/register"} className="inline-flex min-h-11 items-center gap-3 font-semibold text-[var(--color-ink)] hover:underline">{interfaceCopy(isRtl, "site_footer_016")}</Link>
        </div>
      </Grid>
      <ScrollToTopButton />
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
      <h2 className="text-sm font-bold text-[var(--color-ink)]">{title}</h2>
      <div className="mt-5 grid gap-1">
        {links.map((link) => (
          <Link prefetch={false} key={link.href} href={link.href} className="flex min-h-11 items-center text-sm leading-6 text-[var(--color-muted)] transition hover:text-[var(--color-ink)] hover:underline">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

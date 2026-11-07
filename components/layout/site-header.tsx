"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { MegaMenu } from "@/components/marketing/mega-menu";
import { getMarketing } from "@/lib/dictionaries/marketing";

/** يحوّل المسار بين العربية والإنجليزية مع الحفاظ على الصفحة الحالية */
export function alternateLocalePath(pathname: string): string {
  const path = pathname || "/";

  if (path === "/ar" || path === "/ar/") {
    return "/";
  }
  if (path.startsWith("/ar/")) {
    const rest = path.slice(3);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  if (path === "/") {
    return "/ar";
  }
  return `/ar${path.startsWith("/") ? path : `/${path}`}`;
}

export function SiteHeader({ isRtl = false }: { isRtl?: boolean }) {
  const pathname = usePathname() || "/";
  const query = useSearchParams()?.toString() ?? "";
  const altPath = alternateLocalePath(pathname);
  const t = getMarketing(isRtl);
  const home = isRtl ? "/ar" : "/";
  const base = isRtl ? "/ar" : "";
  return <header className="build-header">
    <a className="skip-link" href="#main-content">{t.skip}</a>
    <div className="marketing-container header-inner">
      <Link href={home} aria-label={t.home} className="header-logo"><Image src={isRtl ? "/brand/logo-ar.png" : "/brand/logo-en.png"} alt={t.name} width={isRtl ? 2883 : 2846} height={isRtl ? 1231 : 1287} priority sizes="100px" /></Link>
      <nav aria-label={t.menu} className="header-nav"><MegaMenu isRtl={isRtl} /><Link className="header-desktop" href={`${home}#how-it-works`}>{t.how}</Link><Link className="header-desktop header-audience" href={`${home}#for-projects`}>{t.audience}</Link></nav>
      <div className="header-actions"><Link className="header-desktop" href={`${base}/track-request`}>{t.track}</Link><Link className="language-switch" href={query ? `${altPath}?${query}` : altPath} lang={isRtl ? 'en' : 'ar'} aria-label={isRtl ? 'English' : 'العربية'}>{isRtl ? 'EN' : 'AR'}</Link><Link href={`${base}/get-quote`} className="build-button header-cta">{t.quote}</Link></div>
    </div>
  </header>;
}

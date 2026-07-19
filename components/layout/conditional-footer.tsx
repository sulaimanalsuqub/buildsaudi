"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";

/** صفحات "طلب/تتبع" مركّزة بلا فوتر — نقلل التشتت ونقاط الخروج أثناء تعبئة الطلب */
const FOCUSED_PATHS = ["/get-quote", "/ar/get-quote", "/track-request", "/ar/track-request"];

export function ConditionalFooter({ isRtl }: { isRtl?: boolean }) {
  const pathname = usePathname();
  const isFocused = FOCUSED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isFocused) return null;
  return <SiteFooter isRtl={isRtl} />;
}

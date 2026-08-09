import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";
import { gtAmericaArabic } from "@/lib/fonts";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "تحت الصيانة | بيلد",
  robots: "noindex, nofollow",
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={gtAmericaArabic.className}>{children}</body>
    </html>
  );
}

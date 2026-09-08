import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";
import { gtAmericaArabic } from "@/lib/fonts";
import { GoogleTag } from "@/components/analytics/google-tag";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { absolute: "نحدّث تجربة بيلد | نعود قريبًا" },
  description: "نعمل على تحديث بيلد لتسهيل طلب مواد البناء والتشطيبات لمشروعك. للتواصل خلال الصيانة، راسل فريقنا على sales@build.sa.",
  robots: "noindex, nofollow",
  openGraph: {
    title: "نحدّث تجربة بيلد | نعود قريبًا",
    description: "نعمل على تحديث بيلد لتسهيل طلب مواد البناء والتشطيبات لمشروعك. للتواصل خلال الصيانة، راسل فريقنا على sales@build.sa.",
    url: `${siteConfig.url}/maintenance`,
    images: [{ url: `${siteConfig.url}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "نحدّث تجربة بيلد | نعود قريبًا",
    description: "نعمل على تحديث بيلد لتسهيل طلب مواد البناء والتشطيبات لمشروعك. للتواصل خلال الصيانة، راسل فريقنا على sales@build.sa.",
    images: [`${siteConfig.url}/opengraph-image`],
  },
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <GoogleTag />
      </head>
      <body className={gtAmericaArabic.className}>{children}</body>
    </html>
  );
}

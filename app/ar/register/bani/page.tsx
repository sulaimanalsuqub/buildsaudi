import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: { absolute: "باني من بيلد | قريبًا" },
  description: "نعمل على تجهيز باني من بيلد. لتسجيل منشأتك الآن، انتقل إلى نموذج تسجيل الموردين وأضف بياناتك والمواد التي توفرها.",
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
  alternates: { canonical: `${siteConfig.url}/ar/register/bani`, languages: {} },
  openGraph: {
    title: "باني من بيلد | قريبًا",
    description: "نعمل على تجهيز باني من بيلد. لتسجيل منشأتك الآن، انتقل إلى نموذج تسجيل الموردين وأضف بياناتك والمواد التي توفرها.",
    url: `${siteConfig.url}/ar/register/bani`,
    images: [{ url: `${siteConfig.url}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "باني من بيلد | قريبًا",
    description: "نعمل على تجهيز باني من بيلد. لتسجيل منشأتك الآن، انتقل إلى نموذج تسجيل الموردين وأضف بياناتك والمواد التي توفرها.",
    images: [`${siteConfig.url}/opengraph-image`],
  },
};

export default function BaniRegistrationPage() {
  return (
    <main dir="rtl" className="min-h-[60vh] bg-[#f7f9f6] py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-[0.14em] text-brand-primary">✦ BANI</p>
          <h1 className="type-hero mt-5 text-brand-dark">قريباً</h1>
          <Link href="/ar/register" className="mt-8 inline-flex rounded-full bg-brand-primary px-6 py-3 font-semibold text-white">
            العودة لتسجيل الموردين
          </Link>
        </div>
      </Container>
    </main>
  );
}

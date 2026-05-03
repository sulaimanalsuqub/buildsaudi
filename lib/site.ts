const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.build.sa"
).replace(/\/$/, "");

export const siteConfig = {
  name: "Build",
  nameAr: "بيلد",
  description:
    "Build is a Saudi B2B platform that sources and delivers construction materials DDP to your project site — faster, cheaper, and hassle-free.",
  descriptionAr:
    "بيلد منصة سعودية B2B لتوريد مواد البناء بتوصيل DDP مباشرة لموقع المشروع — أسرع، أوفر، وبدون تعقيد.",
  url: appUrl,
  keywords: [
    "توريد مواد بناء السعودية",
    "مواد بناء بالجملة",
    "توريد مشاريع إنشائية",
    "construction material supply Saudi Arabia",
    "building materials Riyadh",
    "DDP construction supply KSA",
    "B2B building materials platform",
    "مقاولات مواد بناء",
  ],
  keywordsAr: [
    "توريد مواد بناء السعودية",
    "مواد بناء بالجملة الرياض",
    "توريد مشاريع إنشائية",
    "شراء مواد بناء مشاريع",
    "موردي مواد البناء",
    "منصة توريد بناء",
    "DDP توريد مواد",
  ],
};

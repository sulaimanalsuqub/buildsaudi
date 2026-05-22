const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.build.sa"
).replace(/\/$/, "");

export const siteConfig = {
  name: "Build",
  nameAr: "بيلد",
  description:
    "Build connects Saudi construction suppliers with qualified project RFQs and delivery workflows.",
  descriptionAr:
    "بيلد تربط موردي مواد البناء السعوديين بطلبات المشاريع المؤهلة ومسارات التسليم.",
  url: appUrl,
  keywords: [
    "تسجيل مورد مواد بناء السعودية",
    "مورد مواد بناء",
    "طلبات مشاريع إنشائية",
    "construction supplier Saudi Arabia",
    "building materials Riyadh",
    "DDP construction supply KSA",
    "construction supplier network",
    "موردين مواد بناء",
  ],
  keywordsAr: [
    "تسجيل مورد مواد بناء السعودية",
    "مورد مواد بناء الرياض",
    "طلبات مشاريع إنشائية",
    "موردين مواد البناء",
    "شبكة موردي البناء",
    "توريد مواد DDP",
    "تأهيل موردين",
  ],
};

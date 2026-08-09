const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.build.sa"
).replace(/\/$/, "");

export const siteConfig = {
  name: "Build",
  nameAr: "بيلد",
  /** Positioning: supplier of materials & finishes — not a marketplace/platform */
  description:
    "Building materials and finishes supply for contractors and developers across Saudi Arabia, with quotations and delivery directly to your project site.",
  descriptionAr:
    "نورد مواد البناء والتشطيبات للمقاولين والمطورين في السعودية، مع تجهيز العرض والتسليم إلى موقع المشروع في الرياض وجدة وجميع المناطق.",
  url: appUrl,
  salesEmail: "sales@build.sa",
  keywords: [
    "building materials supplier Saudi Arabia",
    "construction materials supplier KSA",
    "building materials for contractors",
    "finishing materials for developers",
    "building materials supply Riyadh",
    "building materials supply Jeddah",
    "steel and cement supply Saudi Arabia",
    "project site material delivery",
    "construction finishes supplier",
    "building materials wholesale contractors",
  ],
  keywordsAr: [
    "مورد مواد بناء",
    "توريد مواد بناء السعودية",
    "مواد بناء للمقاولين",
    "مواد تشطيب للمشاريع",
    "مورد مواد بناء الرياض",
    "مورد مواد بناء جدة",
    "توريد حديد وإسمنت",
    "توريد مواد التشطيب",
    "مورد مواد بناء للمطورين العقاريين",
    "توريد مواد البناء للمشاريع الإنشائية",
    "مورد مواد بناء معتمد",
    "تسليم مواد بناء لموقع المشروع",
  ],
};

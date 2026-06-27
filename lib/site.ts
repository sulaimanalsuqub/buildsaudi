const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.build.sa"
).replace(/\/$/, "");

export const siteConfig = {
  name: "Build",
  nameAr: "بيلد",
  description:
    "Building materials supplier for construction projects across Saudi Arabia. Quotes, bill of quantities, and delivery to your project site.",
  descriptionAr:
    "مورد مواد بناء للمشاريع الإنشائية في المملكة. طلب عرض سعر، جدول كميات، وتوريد مواد البناء مع التسليم لموقع المشروع.",
  url: appUrl,
  keywords: [
    "building materials supplier Saudi Arabia",
    "construction material supply KSA",
    "building materials quote request",
    "bill of quantities supply",
    "construction materials Riyadh",
    "building materials Jeddah",
    "steel and cement supply",
    "project material delivery",
    "wholesale building materials",
    "construction procurement Saudi Arabia",
  ],
  keywordsAr: [
    "مورد مواد بناء",
    "توريد مواد بناء",
    "مواد بناء السعودية",
    "مورد مواد بناء الرياض",
    "مورد مواد بناء جدة",
    "طلب عرض سعر مواد بناء",
    "توريد مواد بناء للمشاريع",
    "مواد بناء للمقاولين",
    "توريد حديد وإسمنت",
    "جدول كميات مواد بناء",
    "توريد مواد البناء للمشاريع الإنشائية",
    "شراء مواد بناء بالجملة",
    "مورد مواد بناء معتمد",
    "توريد مواد التشطيب",
    "مواد بناء للمشاريع الحكومية",
  ],
};
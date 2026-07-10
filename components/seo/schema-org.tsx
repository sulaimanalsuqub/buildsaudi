import { siteConfig } from "@/lib/site";

const areaServed = [
  { "@type": "Country", name: "Saudi Arabia" },
  { "@type": "City", name: "Riyadh" },
  { "@type": "City", name: "Jeddah" },
  { "@type": "City", name: "Dammam" },
  { "@type": "City", name: "Khobar" },
];

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "HomeAndConstructionBusiness"],
    name: "Build Saudi",
    alternateName: ["بيلد", "Build"],
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.png`,
    image: `${siteConfig.url}/icon.png`,
    description: siteConfig.descriptionAr,
    email: siteConfig.salesEmail,
    areaServed,
    knowsAbout: [
      "توريد مواد البناء",
      "توريد مواد التشطيب",
      "مورد مواد بناء للمقاولين",
      "مورد مواد بناء للمطورين",
      "Building materials supply",
      "Construction finishes supply",
      "Project site delivery",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: siteConfig.salesEmail,
      availableLanguage: ["Arabic", "English"],
      areaServed: "SA",
    },
    sameAs: ["https://twitter.com/buildsaudi"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Build Saudi",
    alternateName: "بيلد",
    url: siteConfig.url,
    description: siteConfig.descriptionAr,
    inLanguage: ["ar-SA", "en"],
    publisher: {
      "@type": "Organization",
      name: "Build Saudi",
      url: siteConfig.url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ServiceSchema({ isRtl = false }: { isRtl?: boolean }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: isRtl
      ? "توريد مواد البناء والتشطيب للمشاريع الإنشائية"
      : "Building materials and finishes supply for construction projects",
    name: isRtl
      ? "بيلد — مورد مواد بناء وتشطيب للمشاريع الإنشائية"
      : "Build — Building Materials & Finishes Supplier for Construction Projects",
    description: isRtl ? siteConfig.descriptionAr : siteConfig.description,
    provider: {
      "@type": "Organization",
      name: "Build Saudi",
      url: siteConfig.url,
      email: siteConfig.salesEmail,
    },
    areaServed,
    audience: {
      "@type": "Audience",
      audienceType: isRtl
        ? "مقاولون ومطورون عقاريون"
        : "Contractors and real estate developers",
    },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: isRtl ? `${siteConfig.url}/ar/get-quote` : `${siteConfig.url}/get-quote`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

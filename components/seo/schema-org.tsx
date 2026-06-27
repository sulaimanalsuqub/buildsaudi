import { siteConfig } from "@/lib/site";

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Build Saudi",
    alternateName: "بيلد",
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.png`,
    description: siteConfig.descriptionAr,
    areaServed: {
      "@type": "Country",
      name: "Saudi Arabia",
    },
    knowsAbout: [
      "توريد مواد البناء",
      "مورد مواد بناء",
      "طلب عرض سعر مواد بناء",
      "Construction Material Supply",
      "Building Materials Supplier",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
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
    inLanguage: ["ar", "en"],
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
    serviceType: isRtl ? "توريد مواد البناء" : "Building Materials Supply",
    name: isRtl
      ? "بيلد — مورد مواد بناء للمشاريع الإنشائية"
      : "Build — Building Materials Supplier for Construction Projects",
    description: isRtl ? siteConfig.descriptionAr : siteConfig.description,
    provider: {
      "@type": "Organization",
      name: "Build Saudi",
      url: siteConfig.url,
    },
    areaServed: {
      "@type": "Country",
      name: "Saudi Arabia",
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
import { siteConfig } from "@/lib/site";

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Build Saudi",
    alternateName: "بيلد",
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.png`,
    description: siteConfig.description,
    areaServed: {
      "@type": "Country",
      name: "Saudi Arabia",
    },
    knowsAbout: [
      "Construction Material Supply",
      "توريد مواد البناء",
      "DDP Delivery",
      "B2B Procurement",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["Arabic", "English"],
    },
    sameAs: [],
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
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/get-quote?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: ["en", "ar"],
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
    serviceType: isRtl ? "توريد مواد البناء" : "Construction Material Supply",
    name: isRtl ? "بيلد — توريد مواد البناء DDP" : "Build — DDP Construction Material Supply",
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

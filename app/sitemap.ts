import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

const BASE = siteConfig.url;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // English pages
    {
      url: BASE,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: { languages: { ar: `${BASE}/ar` } },
    },
    {
      url: `${BASE}/get-quote`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: { ar: `${BASE}/ar/get-quote` } },
    },
    {
      url: `${BASE}/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: { languages: { ar: `${BASE}/ar/register` } },
    },
    {
      url: `${BASE}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/terms-conditions`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    // Arabic pages
    {
      url: `${BASE}/ar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: { languages: { en: BASE } },
    },
    {
      url: `${BASE}/ar/get-quote`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: { en: `${BASE}/get-quote` } },
    },
    {
      url: `${BASE}/ar/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: { languages: { en: `${BASE}/register` } },
    },
  ];
}

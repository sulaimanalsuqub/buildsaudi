import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

const BASE = siteConfig.url;

type SitemapEntry = MetadataRoute.Sitemap[number];

function pair(
  enPath: string,
  arPath: string,
  priority: number,
  changeFrequency: SitemapEntry["changeFrequency"],
): SitemapEntry[] {
  const enUrl = enPath === "/" ? BASE : `${BASE}${enPath}`;
  const arUrl = `${BASE}${arPath}`;
  const languages = {
    en: enUrl,
    ar: arUrl,
    "x-default": arUrl,
  };

  return [
    {
      url: enUrl,
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: { languages },
    },
    {
      url: arUrl,
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: { languages },
    },
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...pair("/", "/ar", 1.0, "weekly"),
    ...pair("/get-quote", "/ar/get-quote", 0.9, "weekly"),
    ...pair("/register", "/ar/register", 0.7, "monthly"),
    ...pair("/carriers/register", "/ar/carriers/register", 0.7, "monthly"),
    ...pair("/privacy-policy", "/ar/privacy-policy", 0.3, "yearly"),
    ...pair("/terms-conditions", "/ar/terms-conditions", 0.3, "yearly"),
    ...pair("/cookies-policy", "/ar/cookies-policy", 0.3, "yearly"),
  ];
}

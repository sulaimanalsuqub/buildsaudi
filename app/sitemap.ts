import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

const BASE = siteConfig.url;

type SitemapEntry = MetadataRoute.Sitemap[number];

function page(
  path: string,
  priority: number,
  changeFrequency: SitemapEntry["changeFrequency"],
  alternatePath?: string,
): SitemapEntry {
  const entry: SitemapEntry = {
    url: path === "/" ? BASE : `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  };

  if (alternatePath !== undefined) {
    const altUrl = alternatePath === "/" ? BASE : `${BASE}${alternatePath}`;
    entry.alternates = {
      languages: path.startsWith("/ar")
        ? { en: altUrl }
        : { ar: altUrl },
    };
  }

  return entry;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    page("/", 1.0, "weekly", "/ar"),
    page("/get-quote", 0.9, "weekly", "/ar/get-quote"),
    page("/register", 0.7, "monthly", "/ar/register"),
    page("/privacy-policy", 0.3, "yearly", "/ar/privacy-policy"),
    page("/terms-conditions", 0.3, "yearly", "/ar/terms-conditions"),
    page("/cookies-policy", 0.3, "yearly", "/ar/cookies-policy"),
    page("/ar", 1.0, "weekly", "/"),
    page("/ar/get-quote", 0.9, "weekly", "/get-quote"),
    page("/ar/register", 0.7, "monthly", "/register"),
    page("/ar/privacy-policy", 0.3, "yearly", "/privacy-policy"),
    page("/ar/terms-conditions", 0.3, "yearly", "/terms-conditions"),
    page("/ar/cookies-policy", 0.3, "yearly", "/cookies-policy"),
  ];
}
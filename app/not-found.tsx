import type { Metadata } from "next";

import { NotFoundContent } from "@/components/errors/not-found-content";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
};

/**
 * Catch-all for URLs that match no route at all. Next.js renders this inside
 * whichever root layout it falls back to for unmatched paths — it must NOT
 * declare its own <html>/<body> (doing so produces nested/invalid <html> tags).
 */
export default function NotFound() {
  return <NotFoundContent />;
}

# Google Indexing Diagnosis

Context provided by the owner (not independently verified — no direct Search Console access in this audit): ~4 pages indexed, ~11 not indexed, ~6 clicks / 28 days, average position ~18.4. Sitemap currently contains 14 URLs (7 language pairs), which is roughly consistent with these figures in scale.

No exact Search Console exclusion category (e.g. "Crawled – currently not indexed" vs "Discovered – currently not indexed" vs "Duplicate without user-selected canonical") can be assigned without direct GSC access. The classification below separates what the repo/live crawl can confirm from what stays a hypothesis pending GSC.

## Confirmed technical/performance issues (not indexing-exclusion reasons by themselves)

| Issue | Classification | Reasoning |
|---|---|---|
| Entire site forced into dynamic, uncached SSR (`headers()` in root layout) | **Confirmed technical/performance issue.** **Potential crawl-efficiency issue.** **Not a confirmed Google indexing-exclusion reason** until tied to URL Inspection or Crawl Stats data. | Slower TTFB and zero edge caching can influence crawl budget allocation and rendering cost at scale, but Google does successfully index plenty of fully-dynamic SSR sites. There is no evidence in Search Console (not accessible here) linking this specifically to the "4 indexed / 11 not" gap. Listed as a plausible contributing factor, not a root cause. |
| Missing `dir="rtl"` on Arabic `<html>` | Confirmed technical/accessibility issue. Not evidenced as an indexing-exclusion cause — Google does not exclude pages for this. | Correctness/accessibility/AI-parsing fix, not a diagnosed cause of the 11 non-indexed pages. |
| `https://build.sa` apex uses a 307 instead of 301/308 | Confirmed technical issue on a non-canonical hostname variant. Not applicable to the indexed/non-indexed sitemap URLs themselves, since those are already on `https://www.build.sa`. | Relevant to link-equity consolidation for any external links pointing at the bare apex domain, not to why the canonical `www` URLs aren't indexed. |

## Suspected causes requiring Search Console confirmation

These are hypotheses consistent with a small (14-URL) sitemap and low-competition-content profile, not confirmed defects:

- **Low perceived content value / thin-content judgment by Google** on transactional pages (`/register`, `/carriers/register`, legal pages) — these are short, form-oriented pages with limited unique body text, a common trigger for "Crawled – currently not indexed."
- **New/low-authority domain** with few external backlinks (not measured here — see `authority-and-citation-plan.md`), which can slow initial indexing regardless of on-page quality.
- **Duplicate/near-duplicate judgment** between the three legal pages (`privacy-policy`, `terms-conditions`, `cookies-policy`) if their content is templated/boilerplate — plausible but not confirmed without reading full page content against Google's duplicate-detection behavior (which isn't observable from outside GSC).

## What is explicitly ruled out (confirmed, not just suspected)

- **Not blocked by robots.txt** — all 14 sitemap URLs are allowed.
- **Not `noindex`** — root-level `robots: { index: true, follow: true }` metadata confirmed on live pages; no page-level override found.
- **Not a canonical-to-homepage bug** — every sitemap URL has a correct self-referencing canonical (verified via live `curl`).
- **Not a cross-language canonical/hreflang bug** — each URL's hreflang triplet correctly points to its own equivalents, not to the homepage.
- **Not maintenance-mode interference** — `NEXT_PUBLIC_MAINTENANCE_MODE=false` confirmed in the active environment.
- **Not a 4xx/5xx problem** — every sitemap URL returns HTTP 200.

## Information still needed from Search Console

1. Per-URL entry in the **Page indexing** report (Coverage) for all 14 sitemap URLs, specifically the exclusion label for the ~11 non-indexed ones.
2. **Crawl Stats** report (under Settings) — total crawl requests, average response time, host status — to check whether Googlebot is even fetching most pages regularly.
3. **URL Inspection** live-test result for at least the homepage and `/get-quote` (both locales) to see "Google-selected canonical" vs "User-declared canonical" and confirm there's no canonical mismatch Google is applying on its own.
4. Whether any of the 11 non-indexed URLs show as **"Discovered – currently not indexed"** (crawl budget/priority issue, often self-resolving as domain authority grows) vs **"Crawled – currently not indexed"** (a content-quality signal Google chose not to index despite fetching it) — these call for different remediation.

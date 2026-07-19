# SEO URL Inventory

Source: repository route inspection (`app/(site)/*`, `app/ar/*`) + live crawl (`curl`) + `sitemap.xml` + `robots.txt`. Captured 2026-07-19 against production (`https://www.build.sa`) and, post-fix, against a local production build.

## In sitemap.xml (14 URLs / 7 language pairs)

| EN URL | AR URL | Priority | HTTP | Canonical | Robots | Indexable | Notes |
|---|---|---|---|---|---|---|---|
| `/` | `/ar` | 1.0 | 200 | self | index,follow | yes | Homepage. Unique title/description/OG per locale (confirmed live). |
| `/get-quote` | `/ar/get-quote` | 0.9 | 200 | self | index,follow | yes | Primary conversion page (RFQ contact). |
| `/register` | `/ar/register` | 0.7 | 200 | self | index,follow | yes | Supplier registration entry. |
| `/carriers/register` | `/ar/carriers/register` | 0.7 | 200 | self | index,follow | yes | Carrier/logistics agent registration. |
| `/privacy-policy` | `/ar/privacy-policy` | 0.3 | 200 | self | index,follow | yes | Legal. |
| `/terms-conditions` | `/ar/terms-conditions` | 0.3 | 200 | self | index,follow | yes | Legal. |
| `/cookies-policy` | `/ar/cookies-policy` | 0.3 | 200 | self | index,follow | yes | Legal. |

All 14 sitemap URLs: absolute HTTPS, single canonical hostname (`https://www.build.sa`), correct bidirectional hreflang triplet (en/ar/x-default) generated per-URL by `app/sitemap.ts` — verified against the live `sitemap.xml`, no cross-language mix-ups found.

## Public routes that exist but are intentionally excluded from the sitemap

| URL | HTTP | Robots | Reason excluded | Assessment |
|---|---|---|---|---|
| `/register/complete`, `/ar/register/complete` | 200 (requires valid token/state) | `Disallow` in robots.txt | Post-registration flow step, not a landing page | Correct to exclude |
| `/carriers/register/complete`, `/ar/carriers/register/complete` | 200 (state-dependent) | not explicitly disallowed | Same as above | Should be added to the robots.txt disallow list for consistency (Priority 2, safe) |
| `/track-request`, `/ar/track-request` | 200 | allowed by robots.txt (not disallowed), not in sitemap | Customer-specific lookup tool, no canonical "content" to rank | Low priority; leaving out of sitemap is correct, but since it's crawlable and not `noindex`, confirm it doesn't accumulate as thin/duplicate content in Search Console — flagged as suspected, not confirmed (needs GSC). |

## Not-yet-existing pages referenced by this audit's target architecture

| Planned URL | Status | Approval category |
|---|---|---|
| `/catalog`, `/ar/catalog` + 8 category pages per official catalog | Does not exist — no `app/(site)/catalog` or `app/ar/catalog` directory in the repo | B — requires business approval (new pages, new architecture) |
| `/about` (or equivalent "How Build Works" / entity page) | Does not exist | B — requires business approval |

## Excluded / blocked paths (robots.txt, confirmed correct)

`/admin/`, `/api/`, `/offer/`, `/register/complete`, `/ar/register/complete`, `/maintenance` — all correctly non-indexable (admin redirect, API routes, internal/offer flow, post-submit states, maintenance placeholder).

## Hostname variants (live test)

| Variant | HTTP | Destination |
|---|---|---|
| `http://build.sa` | 308 | `https://build.sa` |
| `https://build.sa` | **307** | `https://www.build.sa/` |
| `http://www.build.sa` | 308 | `https://www.build.sa` |
| `https://www.build.sa` | 200 | canonical |

The `https://build.sa` → `https://www.build.sa` hop uses a temporary (307) redirect instead of permanent (301/308) — see `seo-technical-audit.md`.

## What still requires Search Console (cannot be derived from the repo/live crawl)

- Actual per-URL indexing status/exclusion reason for the ~14 sitemap URLs (owner reported ~4 indexed / ~11 not indexed in the last 28 days, but the exact GSC exclusion category per URL — e.g. "Crawled – currently not indexed" vs "Discovered – currently not indexed" — is not visible without GSC access).
- Crawl Stats report (Googlebot fetch frequency/response time/host status).
- Whether `/track-request` and `/ar/track-request` are being flagged as duplicate/thin content.

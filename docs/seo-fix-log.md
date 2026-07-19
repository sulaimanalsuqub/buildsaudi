# SEO Fix Log

Branch: `seo/technical-and-ai-search-optimization` (not merged into `main`, not deployed).

## Fix #1 — Root layout forced 100% of routes into dynamic (uncached) SSR

- **File(s) changed:** `app/layout.tsx` (deleted) → replaced by `app/(site)/layout.tsx`, `app/ar/layout.tsx`, `app/maintenance/layout.tsx` (all modified/rewritten). Supporting new files: `lib/fonts.ts`, `lib/metadata.ts`, `components/analytics/gtm.tsx`, `components/errors/not-found-content.tsx`, `components/errors/global-error-content.tsx`, `app/global-error.tsx`, `app/(site)/not-found.tsx`, `app/(site)/error.tsx`, `app/ar/not-found.tsx`, `app/ar/error.tsx`, `app/not-found.tsx` (simplified).
- **URL affected:** all public routes (`/`, `/ar`, `/get-quote`, `/ar/get-quote`, `/register`, `/ar/register`, `/carriers/register`, `/privacy-policy`, `/terms-conditions`, `/cookies-policy`, `/track-request`, and ar equivalents).
- **Existing problem:** `app/layout.tsx` called `await headers()` to read an `x-pathname` header (set by middleware) purely to decide `lang="ar"` vs `"en"` on `<html>`. Any use of `headers()`/`cookies()` in a layout opts the entire subtree out of static rendering in Next.js App Router.
- **Evidence:** `next build` (baseline, before fix) marked every route `ƒ` (Dynamic) except icons/robots/sitemap. Live response headers on production showed `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` and `x-vercel-cache: MISS` on every page, including static legal pages.
- **Technical cause:** single shared root layout needed to branch behavior between the `(site)` and `ar` route groups, and used a request-time header read to do it.
- **Change made:** Split into two independent Next.js root layouts (the documented "multiple root layouts" pattern) — `app/(site)/layout.tsx` (`<html lang="en" dir="ltr">`) and `app/ar/layout.tsx` (`<html lang="ar" dir="rtl">`) — each fully static, no `headers()` call. `app/maintenance/layout.tsx` got its own minimal root layout since it no longer inherits one from the deleted shared root. Since Next.js requires exactly one `<html>`/`<body>` owner per matched route tree, this also required: duplicating `not-found.tsx`/`error.tsx` per locale segment, adding `app/global-error.tsx` (Next's dedicated catcher for crashes in the root layout itself, which must carry its own `<html>`), and keeping a locale-agnostic `app/not-found.tsx` for URLs that match no route at all.
- **SEO benefit:** static pages can now be served from Vercel's edge cache instead of hitting a serverless function on every request; lower TTFB improves Core Web Vitals (a Google ranking/crawl-efficiency input) and gives crawlers a faster, more consistent response.
- **AI-search benefit:** faster, cacheable raw HTML is cheaper and more reliable for any crawler (OAI-SearchBot, GPTBot, Googlebot) to fetch and re-fetch, which matters for re-crawl frequency and citation freshness.
- **Test performed:** clean `next build` (verified 0 warnings, all routes `○ Static` except `/api/*`), `npm run lint` (clean), local `npm start` + `curl` against every route + two invalid URLs per locale + `/maintenance`, comparing `<html>` tag, `Cache-Control` header, and HTTP status before/after.
- **Test result:**
  - All previously-`ƒ` routes are now `○ Static`.
  - `Cache-Control` changed from `private, no-cache, no-store, max-age=0, must-revalidate` to `s-maxage=31536000` on every static page.
  - `<html lang="en" dir="ltr">` / `<html lang="ar" dir="rtl">` render correctly per locale on every page, including `/maintenance`.
  - 404s still return real HTTP 404 in both locales, with exactly one `<html>` tag (an intermediate attempt to give the locale-agnostic `not-found.tsx` its own `<html>` produced **nested/invalid `<html>` tags** — caught locally, reverted before commit; see note below).
  - Genuinely unmatched URLs (typos, non-existent paths) render inside the `(site)` (English) shell regardless of an `/ar/` prefix, since Next.js cannot resolve a route-group root layout for a path that matches no route at all. This is an existing Next.js App Router limitation, not something introduced by this fix. Net effect vs. the pre-fix site: pre-fix, a nonexistent `/ar/xxx` URL got `<html lang="ar">` (via the header trick, which runs on literally every request including 404s) but never `dir="rtl"`; post-fix it consistently gets `<html lang="en" dir="ltr">` with the (still Arabic-only) 404 message text. Since these URLs return HTTP 404 and are marked `noindex`, this has no SEO/indexing weight — documented here for transparency, not treated as a regression worth further architectural risk to fix.
- **Remaining risk:** none identified for indexable pages. The 404-locale cosmetic point above is the only known behavior change, isolated to non-indexed error pages.

## Fix #2 — Missing `dir="rtl"` on `<html>` for Arabic pages

- **File(s) changed:** `app/ar/layout.tsx` (folded into Fix #1's restructuring, since dir has to live on the same `<html>` tag as `lang`).
- **URL affected:** all `/ar/*` routes.
- **Existing problem:** `<html lang="ar">` had no `dir` attribute. `dir="rtl"` was only set on an inner `<section>` inside `<body>`.
- **Evidence:** live `curl https://www.build.sa/ar` showed `<html lang="ar">` with no `dir`; confirmed in `app/layout.tsx` (old) and `app/ar/layout.tsx` (old) source.
- **Change made:** `app/ar/layout.tsx` now renders `<html lang="ar" dir="rtl">` directly.
- **SEO/AI benefit:** matches the documented international-SEO requirement; more reliable RTL rendering signal for browsers, assistive tech, and any crawler/AI system parsing the document root rather than nested markup.
- **Test performed/result:** same local build+server pass as Fix #1; confirmed via `curl` on `/ar`, `/ar/get-quote`, `/ar/register`, `/ar/privacy-policy`, `/ar/track-request`.

## Not changed in this pass (documented separately)

- Apex-domain redirect inconsistency (`https://build.sa` → 307 instead of 301/308) — Vercel domain configuration, not a code change. See `seo-technical-audit.md`.
- GPTBot / OAI-SearchBot explicit robots.txt rules — owner decision pending. See `ai-search-optimization-audit.md`.
- Entity positioning conflict (site copy says "supplier" vs. official brief positioning as "sourcing/procurement company") — content change, requires business approval. See `entity-consistency-audit.md` and `approval-required-recommendations.md`.

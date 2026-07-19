# Post-Deployment Checklist

This branch (`seo/technical-and-ai-search-optimization`) has **not** been merged or deployed. This checklist applies once the owner approves merging/deploying it (and, separately, once any Category B items are approved and added).

## Before merge

- [ ] Review this branch's diff against `main` (currently: root-layout split + `dir="rtl"` fix only — see `seo-fix-log.md`).
- [ ] Confirm `main` has not diverged further in a way that reintroduces `headers()`/dynamic-forcing patterns in the root layout (this was already accidentally reintroduced once mid-audit by a concurrent session and had to be re-fixed — worth a deliberate double-check before merge).
- [ ] Run `npm run build` and `npm run lint` one more time on the final merge commit.

## Deploy

- [ ] Deploy to a Vercel **preview** environment first — do not deploy straight to production.
- [ ] On the preview: re-run the same manual checks as this audit — `curl` the homepage, `/ar`, `/get-quote`, `/ar/get-quote`, a nonexistent path in each locale, and `/maintenance`; confirm `<html lang/dir>`, `Cache-Control`, and HTTP status match what's documented in `seo-fix-log.md`.
- [ ] Manually click through `/get-quote` and `/register` (both locales) in a browser to confirm forms, Odoo/Resend integrations, and Turnstile still work — this audit only verified HTTP-level behavior, not full form submission end-to-end.
- [ ] Verify canonical domain (`https://www.build.sa`) and confirm the Vercel project's apex-domain redirect issue (307, see `seo-technical-audit.md` #3) is addressed separately if the owner chooses to act on it.
- [ ] Verify `robots.txt` and `sitemap.xml` on the preview render identically to production (they're both dynamically generated from the same source, so this should be a non-event, but confirm).
- [ ] If the OAI-SearchBot/GPTBot robots.txt decisions from `ai-search-optimization-audit.md` are approved before this merges, verify they render correctly on the preview too.

## After production deploy

- [ ] Submit `sitemap.xml` in Search Console (only if it changed — it didn't in this pass).
- [ ] Use URL Inspection to request re-indexing only for pages actually affected by a real fix — do not mass-request indexing for all 14 URLs, and do not repeat requests.
- [ ] Monitor over the next 7 / 28 / 90 days: indexed-page count, excluded-page count, crawl errors, impressions, clicks, average position, branded vs. non-branded query split, Arabic vs. English query split.
- [ ] Monitor Core Web Vitals (via CrUX/PageSpeed once enough field data accumulates) to confirm the static-rendering fix actually improved LCP/TTFB in the field, not just in local testing.
- [ ] If GA4 custom events (from `seo-ai-measurement-plan.md`) are implemented in a later pass, confirm they appear correctly in GA4 real-time reports before relying on them.

No claim is made here that any of the above guarantees a ranking improvement, AI citation, or a specific indexing outcome — per the brief's explicit instruction not to promise results.

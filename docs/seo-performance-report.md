# Performance / Core Web Vitals Report

No Lighthouse/PageSpeed Insights/CrUX API call was available in this environment, so this is based on build output, response headers, and static code inspection — not live Core Web Vitals field data.

## Rendering (fixed this pass)

Before: every route (including static legal pages) was server-rendered on every request (`ƒ Dynamic` in `next build`), with `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` — meaning Vercel's edge cache never served a cached response, and every visit (including repeat crawler fetches) hit a cold serverless function. After the root-layout fix (`seo-fix-log.md`), all public routes are `○ Static` with `Cache-Control: s-maxage=31536000`, so they can be served from Vercel's edge cache. This should materially reduce TTFB, which is a direct input to LCP.

## Images

- All image usage in `app/`/`components/` goes through `next/image` (0 raw `<img>` tags found) — Next.js already handles responsive `srcset`, format negotiation (WebP/AVIF), and lazy-loading below the fold by default for these.
- Raw source files are large: `public/images/build-truck-vendor.png` (4.0MB), `buildman.png` (1.7MB), `build-truck-hero.png` (1.0MB), `build-truck.png` (652KB), `build-icon.png` (332KB). Since `next/image` transforms on demand, this isn't an active rendering bug, but smaller source files reduce transform/build cost. **Not changed in this pass** (Category A, Priority 3 — low urgency).
- Whichever image is used as the actual homepage hero (LCP candidate) should carry `priority` and no `loading="lazy"` — this needs a quick manual check against `components/sections/home-content.tsx` / the hero component before the next iteration, not confirmed either way here.

## Fonts

- `GTAmericaArabic` local font, 5 weights (300/400/500/700/900), loaded via `next/font/local` with `display: "swap"` already set — this is already the correct pattern (no FOIT, no third-party font-loading round trip). Moved into a shared `lib/fonts.ts` module in this pass so both locale root layouts reuse the exact same font instance rather than loading it twice — same 5 files, same weights, no duplication introduced.

## Third-party scripts

- Google Tag Manager (`GTM-KBN6BHR`) loads via `next/script` with `strategy="afterInteractive"` — correct pattern, does not block initial render.
- Cloudflare Turnstile (`challenges.cloudflare.com`, referenced in CSP) is used for form bot-protection — scoped to form pages, not loaded globally on every page (not independently re-verified in this pass, inherited from prior CSP audit).
- `framer-motion` and `gsap` are both dependencies. Their actual usage scope (global vs. per-component/lazy) was not re-audited in this pass — flagged as a follow-up for the next iteration of this audit, not confirmed as a problem.

## Not measured in this pass

- Real LCP/INP/CLS field data (needs CrUX/PageSpeed Insights API or a real Lighthouse run against the deployed preview).
- JS execution time / main-thread blocking breakdown.
- Whether `prefers-reduced-motion` is respected by the GSAP/framer-motion animations.

Recommend running Lighthouse (mobile + desktop) against the Vercel preview URL for this branch once available, for homepage, `/ar`, `/get-quote`, and `/register`, before/after comparison — not done here due to no live preview URL being available in this session.

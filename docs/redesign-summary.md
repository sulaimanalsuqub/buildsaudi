# Build Saudi marketing redesign

Production update: published with user authorization on 2026-11-08 from source commit `6543f12`, using the existing Vercel project. Live domain: https://www.build.sa. Deployment: https://buildsaudi-9n8dgc1io-sulaimans-projects-be250e4d.vercel.app. The Arabic/English homepages, quote, tracking and registration routes, OpenGraph image and health endpoint returned HTTP 200. Both homepages show the new hero and omit the removed testimonial section. No push to main was performed. The local-only status below records the original pre-publication handoff.

Implemented on `redesign/hatif-style` in `/Users/sulaiman/buildsaudi`. No push or deployment performed. After user review, the sample testimonial section was removed from both languages; the original implementation and audit record below describes the preceding full brief.

## What changed
The homepage now explains the supply journey through a phone conversation, existing manufacturer logos, three numbered process demonstrations, eight material categories, four alternating feature demonstrations, a qualitative sourcing comparison, warranty explanation, clearly labelled sample testimonials, accessible FAQ and closing quote CTA.

Shared navigation is fixed and includes a keyboard-accessible mega menu, route-preserving language switch, quote action and tracking. Existing footer links, social accounts, contact details and warranty badge remain. Quote, tracking and registration inherit the same fonts, accessible controls, palette and footer. Existing form payloads, validation, backend/API logic, env files, analytics IDs and OpenGraph route are unchanged.

## Design system and components
Deep green `#003932`, lime `#C5D92D`, warm neutral `#F4F3EB`; muted text `#536760`. CSS variables feed Tailwind brand colors. Controls use 12px corners, surfaces 16px, with restrained offset shadows. IBM Plex Sans Arabic and IBM Plex Sans load through next/font. Arabic uses logical spacing and mirrored directional icons. Western digits remain in demonstrations.

Reusable components: Hero, PhoneMockup, UiMockup, StepCard, CategoryCard, BrandMarquee, FeatureShowcase, Comparison, TrustSection, Testimonials, Faq, CtaBand, MegaMenu and ActionLink. New original copy is in `lib/dictionaries/marketing.ts`; extracted existing form/footer copy is in `lib/dictionaries/interface.ts`.

## Preview
```sh
cd /Users/sulaiman/buildsaudi
npm install
npm run dev
```
Open `http://localhost:3000/ar` for Arabic and `http://localhost:3000/` for English. Existing locale routing was deliberately preserved. For a production preview: `npm run build && npm start`.

## Content to replace
See `TODO.md`. Testimonials are explicitly fictional sample copy with no customer identities or ratings. Demo quote amount and ETA are illustrative. No performance statistics or new photos were invented. Obtain permissioned customer quotations and product-specific availability/warranty confirmation before publishing stronger claims.

## Verification
- Production build and TypeScript pass; lint has no new warnings/errors.
- Existing warnings: three React Hook Form compiler notices, Next middleware convention deprecation, stale Browserslist data.
- Full existing regression suite: 66/67 pass. The shared-store test “production refuses to process protected operations without shared Redis” fails identically using files extracted from baseline commit `4afc8c8`. Backend changes are explicitly out of scope.
- 104 production screenshots: 12 route families × Arabic/English × 360/768/1024/1440, plus the existing Arabic-only maintenance and Bani placeholder routes at all four widths. No horizontal document overflow or missing images. All pages have headings after hydration. Local screenshots: `.impeccable/review/`; measurements: `docs/visual-checks.json`.
- Keyboard menu open/Escape/focus restoration, FAQ expansion, category anchors, motion pause/reduced-motion, locale query preservation, local empty-form validation, canonical/hreflang and analytics presence pass; see `docs/interaction-checks.json`.
- Independent visual reviewer scored all three requested fixes resolved: registration CTA contrast, placeholder/helper contrast, and quote CTA/SLA correction. The verdict covered those findings, not a backend audit.
- Design documentation was written by the documenter before it hit a tool usage limit; its completed files were inspected and JSON validity checked by the primary agent.

See `docs/design-research.md`, `docs/brand-audit.md`, `DECISIONS.md`, and `DESIGN.md` for sources and implementation decisions. No project dependencies were added; Lighthouse was run from the npm tool cache.

## Final mobile Lighthouse result
Both Arabic and English homepages scored **100 Performance / 100 Accessibility / 100 Best Practices / 100 SEO** in the final local production runs, with the existing analytics enabled. See `docs/lighthouse-results.json` for timestamps, audit version and metrics. These are laboratory results, not a guarantee of production field scores.

The final performance work removes header hydration displacement, avoids unnecessary form prefetch, loads fonts only for the active language, and defers Framer Motion menu features until opening. Arabic uses regular and semibold faces. No environment or analytics configuration was changed.

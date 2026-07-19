# Approval-Required Recommendations (Category B)

None of the items below have been implemented. Each requires an explicit owner/business decision per the audit's change-approval policy. Silence is not approval.

## 1. Entity positioning rewrite: "supplier" → "sourcing/procurement company"

**Where:** `lib/site.ts` (`description`, `descriptionAr`), homepage copy (`components/sections/home-content.tsx`), root layout titles/OG (`app/(site)/layout.tsx`, `app/ar/layout.tsx`), `ServiceSchema.serviceType` (`components/seo/schema-org.tsx`).

**Why:** the brief's official positioning is a B2B sourcing/procurement company managing RFQ → sourcing → comparison → logistics → delivery; the live site consistently describes Build as a direct materials supplier. See `entity-consistency-audit.md` for the full comparison.

**Proposed copy** (drafts from the brief, for review — not implemented):
- EN: "Build is a Saudi B2B building materials sourcing and procurement company that sources construction materials from qualified local and international suppliers for projects across Saudi Arabia."
- AR: "Build شركة سعودية متخصصة في توريد مواد البناء للمشاريع من موردين محليين ودوليين، وإدارة طلبات الأسعار ومقارنة عروض الموردين والشحن والاستيراد والتسليم داخل المملكة."

**Risk if implemented without approval:** changes how the business publicly represents itself (supplier vs. intermediary) — has commercial/legal implications beyond SEO.

## 2. `HomeAndConstructionBusiness` schema type — add real address/geo, or drop it

**Where:** `components/seo/schema-org.tsx` (`OrganizationSchema`).

**Decision needed:** does Build have a public office address it wants disclosed in structured data? If yes, provide it. If no, recommend dropping `HomeAndConstructionBusiness` and keeping plain `Organization` (schema.org / Google guidance: don't assert a LocalBusiness subtype without backing physical-location fields).

## 3. New pages: About / How Build Works

**Where:** would be new routes, e.g. `app/(site)/about/page.tsx` + `app/ar/about/page.tsx`.

**Why:** no page currently exists that an AI system or a human researching Build can cite for "what is Build," "how does the RFQ/BOQ process work," "how are suppliers selected." The homepage only has a one-line description.

**Not implemented:** new page creation with real content is explicitly Category B in the brief (Phase 25, Priority 4).

## 4. New pages: 8 official catalog categories

**Where:** would be new routes, e.g. `/catalog` + `/catalog/sanitary-ware`, `/catalog/electrical-lighting`, etc. (English), and Arabic equivalents.

**Current state:** the 8 categories exist only as static homepage cards (`components/sections/home-content.tsx`), not as linkable/indexable pages.

**Why it matters for SEO/GEO:** category-specific pages are the natural target for category-specific queries ("plumbing supplier Saudi Arabia," "مورد أدوات صحية") and give AI systems something concrete to cite per category. The brief's Phase 15 spells out required page content (what the category contains, sourcing process, supplier qualification, related categories, CTA) — this is real content work, not a template stamp-out, so it needs approval and content investment, not a bulk-generated thin page per category (which the brief explicitly forbids).

**Not implemented.**

## 5. GA4/GTM custom conversion events

**Where:** would touch form-submission handlers for `/get-quote`, `/register`, `/carriers/register`.

**Why:** no `dataLayer.push`/`gtag()` calls exist anywhere in the codebase today — GTM is installed but not receiving any custom events (`request_quote_submitted`, `supplier_registration_submitted`, etc.), so conversion-attribution and AI-referral-traffic-to-conversion tracking (Phase 23) is currently not measurable at all beyond raw pageviews.

**Why Category B and not just implemented directly:** requires agreeing on an event-naming taxonomy and confirming no personal form data (name, email, phone) gets passed into event parameters (privacy requirement explicitly stated in the brief). See `seo-ai-measurement-plan.md`.

## 6. GPTBot robots.txt policy

**Where:** `app/robots.ts`.

**Decision needed:** Allow (opt in to AI training use), Disallow (opt out, keep only OAI-SearchBot/citation access), or leave implicit via the wildcard. See `ai-search-optimization-audit.md` for the tradeoff explanation. Recommend "Disallow GPTBot, explicitly Allow OAI-SearchBot" as the common B2B default, but this is the owner's call.

## 7. Apex-domain redirect type (`https://build.sa` → 307)

**Where:** Vercel project → Domains settings (not a repository change).

**Why flagged here rather than fixed directly:** it's outside the repository's control surface — this audit only has code/branch access, not the Vercel dashboard. Recommend the owner (or whoever holds Vercel project access) change the apex-to-www redirect to a permanent (308) redirect to match the other three hostname-variant redirects, which are already 308.

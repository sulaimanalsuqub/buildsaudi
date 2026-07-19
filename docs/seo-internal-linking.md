# Internal Linking Audit

## Current state (confirmed from `components/layout/site-header.tsx`, `site-footer.tsx`, `conditional-footer.tsx`)

- Header/footer link structure is locale-scoped correctly: `isRtl` prop drives whether links point to the `/ar/*` or root-level equivalents (e.g. footer's `legalBase = isRtl ? "/ar" : ""`) — Arabic pages link to Arabic pages, English to English. No cross-locale link-target bugs found.
- Footer links: Home, Order Products (`/get-quote`), Become a Supplier (`/register`), plus legal pages (privacy/terms/cookies). `ConditionalFooter` hides the footer entirely on `/get-quote` and `/track-request` (both locales) — a deliberate, already-approved UX decision (per git history: "Hide footer on the focused request/tracking flow pages") to reduce distraction during form completion. Reasonable; not flagged as an issue.
- Homepage lists the 8 official categories as static cards with **no individual links** (`components/sections/home-content.tsx`) — they're descriptive only, not internal links, because there is nothing to link to yet (no catalog pages exist).
- No breadcrumbs anywhere on the site (none of the pages are more than one level deep today, so this is low-impact currently).

## Orphan pages

None of the 14 sitemap URLs are orphaned — every one is reachable from the header/footer nav on at least one locale. `/carriers/register` is linked from the footer only in some states (not fully re-verified across all conditional-footer logic branches — flagged as needing a quick manual click-through, not confirmed as broken).

## Gaps tied to missing pages (not something to fix independently — see approval doc)

- The suggested customer journey (Homepage → procurement explainer → Catalog → Category page → Request a quotation) and the suggested category cross-links (sanitary ware ↔ plumbing, flooring ↔ adhesives, wall cladding ↔ adhesives, paints ↔ wall cladding) **cannot be implemented today** because the intermediate pages (About/procurement explainer, catalog, category pages) don't exist. This is a direct downstream consequence of the Category B gaps in `approval-required-recommendations.md`, not a separate internal-linking bug.
- Once category pages are approved and built, they should cross-link per the brief's suggested pairs (Phase 19) and link back to `/get-quote` as the primary CTA — noted here for whoever implements those pages next, not actioned now.

## Recommendation

No internal-linking changes were made in this pass — the existing header/footer structure is correctly locale-scoped and has no orphaned indexable pages today. The real internal-linking opportunity is entirely gated on the new pages in `approval-required-recommendations.md` being approved and built first.

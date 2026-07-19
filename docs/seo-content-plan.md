# Content Plan (Category B — none implemented)

This lists proposed visible-content changes only. Per the change-approval policy, each entry requires explicit sign-off before implementation; none has been applied in this branch.

## 1. Homepage & site-wide metadata: reposition from "supplier" to "sourcing/procurement company"

- **Existing:** "Building materials and finishes supplier for construction projects in Saudi Arabia. We supply contractors and developers with delivery to site across the Kingdom." (`lib/site.ts`, mirrored in page titles and `ServiceSchema`)
- **Proposed:** "Build is a Saudi B2B building materials sourcing and procurement company that sources construction materials from qualified local and international suppliers for projects across Saudi Arabia."
- **Reason:** matches the brief's official positioning; current copy misrepresents Build as a direct supplier/stockist. See `entity-consistency-audit.md`.
- **Target query/question:** "building materials sourcing company Saudi Arabia," "company that manages construction RFQs and BOQs," "شركة تدير مشتريات المشاريع."
- **Approval status:** pending.

## 2. New page: About / How Build Works

- **Existing:** nothing — no About page exists.
- **Proposed:** a page explaining the RFQ/BOQ intake → supplier sourcing (local + international) → quotation comparison → logistics/import → delivery process, per Phase 13's list of questions the site should be able to answer.
- **Reason:** currently no page can be cited by a human or an AI system for "how does Build work" — the single highest-leverage gap identified in this audit for both traditional SEO and AI-answer citation.
- **Target query/question:** "how does Build source materials," "does Build source internationally," "من أفضل موردي مواد البناء للمشاريع؟"
- **Approval status:** pending — needs real, business-approved process detail (this audit will not invent supplier-qualification criteria, sourcing regions, or timelines).

## 3. New category pages for the 8 official catalog categories

- **Existing:** categories listed only as static homepage cards, no linkable page per category.
- **Proposed:** one page per category (`/catalog/sanitary-ware`, etc.) covering: what the category contains, typical project use, information needed for a quotation, local + international sourcing notes, related categories, and a request-quote CTA — per Phase 15's required content list (not a thin template stamp-out).
- **Reason:** closes the single largest keyword/topic gap identified in `seo-and-ai-keyword-map.md`.
- **Approval status:** pending — real content investment required per category; explicitly not to be bulk-generated.

## 4. Homepage/schema mention of international sourcing

- **Existing:** all visible copy only mentions delivery "across the Kingdom" — no mention of international sourcing anywhere, despite the "Sourcing the World" tagline.
- **Proposed:** add a factual sentence (once approved wording exists) noting Build sources from qualified international suppliers when required by project/spec/availability, matching the brief's actual business description.
- **Reason:** current copy actively contradicts the company's own tagline and official positioning — an AI system or reader summarizing the current site would not know Build does any international sourcing at all.
- **Approval status:** pending.

No filler content, invented statistics, invented customer/project examples, or AI-generated boilerplate is proposed anywhere in this plan, per the brief's explicit prohibition.

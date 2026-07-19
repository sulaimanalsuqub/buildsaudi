# SEO & AI Keyword Map

Cross-referencing the brief's target query lists (Phases 11 and 16) against what the site currently targets (`lib/site.ts` → `siteConfig.keywords` / `keywordsAr`, and live per-page `<meta name="keywords">`) and what pages actually exist to target them.

## Current state: what the site already targets (confirmed from code + live HTML)

`siteConfig.keywords` (English, used as the default `<meta name="keywords">` on English pages before per-page override): `building materials supplier Saudi Arabia`, `construction materials supplier KSA`, `building materials for contractors`, `finishing materials for developers`, `building materials supply Riyadh`, `building materials supply Jeddah`, `steel and cement supply Saudi Arabia`, `project site material delivery`, `construction finishes supplier`, `building materials wholesale contractors`.

`siteConfig.keywordsAr` (Arabic): مورد مواد بناء، توريد مواد بناء السعودية، مواد بناء للمقاولين، مواد تشطيب للمشاريع، مورد مواد بناء الرياض، مورد مواد بناء جدة، توريد حديد وإسمنت، توريد مواد التشطيب، مورد مواد بناء للمطورين العقاريين، توريد مواد البناء للمشاريع الإنشائية، مورد مواد بناء معتمد، تسليم مواد بناء لموقع المشروع.

**Observation:** these are all "supplier"-framed (matches the entity-consistency issue in `entity-consistency-audit.md`), and none are category-specific (no sanitary ware / electrical / HVAC / flooring / cladding / paint / adhesives terms anywhere in code). This lines up exactly with the missing catalog pages (`approval-required-recommendations.md` #4) — there is currently no page for any category-specific keyword to rank on.

## Target-to-URL mapping

| Keyword (theme) | Language | Intent | Existing target URL | Gap |
|---|---|---|---|---|
| building materials supplier Saudi Arabia / مورد مواد بناء السعودية | EN/AR | Informational→transactional, top-of-funnel | Homepage (`/`, `/ar`) | Covered, but framed as "supplier" not "sourcing company" — see entity audit |
| building materials RFQ / طلب عرض سعر مواد بناء | EN/AR | Transactional | `/get-quote`, `/ar/get-quote` | Covered |
| تسجيل مورد مواد بناء / become a building materials supplier | EN/AR | Supplier-side transactional | `/register`, `/ar/register` | Covered |
| sanitary ware supplier Saudi Arabia / مورد أدوات صحية | EN/AR | Category-specific transactional | **None** | Missing — needs `/catalog/sanitary-ware` (Category B, see approval doc) |
| electrical and lighting supplier / مورد كهرباء وإنارة | EN/AR | Category-specific | **None** | Missing — same gap |
| plumbing and piping supplier / مورد سباكة وأنابيب | EN/AR | Category-specific | **None** | Missing |
| HVAC supplier Saudi Arabia / مورد تكييف وتهوية | EN/AR | Category-specific | **None** | Missing |
| flooring materials / سيراميك وبورسلين | EN/AR | Category-specific | **None** | Missing |
| wall cladding supplier / كسوات وتكسيات جدارية | EN/AR | Category-specific | **None** | Missing |
| paints supplier for construction / دهانات للمشاريع | EN/AR | Category-specific | **None** | Missing |
| construction adhesives supplier / لواصق ومواد مساعدة | EN/AR | Category-specific | **None** | Missing |
| international building materials sourcing / التوريد الدولي لمواد البناء | EN/AR | Differentiator, matches "Sourcing the World" tagline | **None** — no page or copy currently mentions international sourcing at all | Missing, and notably contradicts the current homepage copy which only mentions delivery "across the Kingdom" |
| company that manages construction RFQs and BOQs / شركة تدير RFQ ومقارنة عروض | EN/AR | Entity-clarity / AI-answer query | **None** — no process-explanation page exists | Missing — see About/How-it-works recommendation |

## Priority (not implemented — all require the new pages classified as Category B)

1. Category pages for the 8 official catalog categories (largest keyword gap, most direct commercial relevance).
2. An About/How-it-works page covering process, local + international sourcing, and supplier qualification (fills the "company that manages RFQs/BOQs" and "international sourcing" gaps, and is the single highest-leverage page for AI-answer citation per `ai-search-optimization-audit.md`).
3. Revisit `siteConfig.keywords`/`keywordsAr` once the entity-positioning decision (`entity-consistency-audit.md`) is made, so keyword targeting matches whatever final positioning is approved.

No keyword insertion into existing page copy was done in this pass — this document is a gap analysis to inform future content work, not a set of implemented changes.

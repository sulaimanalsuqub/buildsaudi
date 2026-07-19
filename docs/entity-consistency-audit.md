# Entity Consistency Audit

## The conflict

The audit brief defines Build's official positioning as a **B2B sourcing/procurement company**:

> Build manages the procurement process from receiving the RFQ or BOQ through supplier sourcing, quotation comparison, logistics, importation when required, and final delivery to the project. Build is not ... a manufacturer of every listed material ... unless business documentation explicitly confirms.

The current live site's copy, present across nearly every metadata surface, instead consistently describes Build as a direct **materials & finishes supplier**:

| Source | Current description | Conflict |
|---|---|---|
| `lib/site.ts` → `siteConfig.description` | "Building materials and finishes **supplier** for construction projects in Saudi Arabia. **We supply** contractors and developers with delivery to site..." | "Supplier" / "we supply" implies Build stocks/sells materials directly, not that it sources and manages procurement on the customer's behalf. |
| `lib/site.ts` → `siteConfig.descriptionAr` | "**مورد** مواد بناء وتشطيب للمشاريع الإنشائية... **نورد** للمقاولين والمطورين..." | Same conflict in Arabic — "مورد"/"نورد" (supplier/we supply) rather than "شركة توريد وإدارة مشتريات" (sourcing/procurement management company). |
| `components/seo/schema-org.tsx` → `ServiceSchema` | `serviceType`: "Building materials and finishes **supply** for construction projects" | Same "supply" framing in structured data read by search engines and AI systems. |
| Homepage (`components/sections/home-content.tsx`) | "Supply of building materials and finishes for contractors and developers" | Same framing on the single highest-authority page of the site. |
| `app/(site)/layout.tsx` / `app/ar/layout.tsx` (this branch, inherited from prior root layout) | Title: "Build \| Building Materials & Finishes **Supplier** — Saudi Arabia" | Same framing in the single most-crawled `<title>` on the domain. |

This is a real, site-wide, consistent — but consistently **wrong relative to the brief** — entity description. It is not a case of conflicting pages (marketplace on one, retailer on another); the site is internally consistent, just consistently positioned as a direct supplier rather than a sourcing/procurement intermediary.

## Structured-data specific issue

`OrganizationSchema` sets `"@type": ["Organization", "HomeAndConstructionBusiness"]`. `HomeAndConstructionBusiness` is a schema.org `LocalBusiness` subtype, which per schema.org's own guidance and the brief's Phase 17 rule ("Do not use LocalBusiness without valid physical business information") should carry `address`, `geo`, and ideally `openingHours`. None of these are present in the current schema — only `logo`, `email`, `areaServed` (city list), and `contactPoint`. This is a real, confirmed mismatch between the schema type asserted and the fields backing it up.

## Recommended consistent description (per the brief, marked for approval — not implemented)

- **English:** "Build is a Saudi B2B building materials sourcing and procurement company that sources construction materials from qualified local and international suppliers for projects across Saudi Arabia."
- **Arabic:** "Build شركة سعودية متخصصة في توريد مواد البناء للمشاريع من موردين محليين ودوليين، وإدارة طلبات الأسعار ومقارنة عروض الموردين والشحن والاستيراد والتسليم داخل المملكة."

## Classification

| Item | Category | Notes |
|---|---|---|
| Rewriting `siteConfig.description`/`descriptionAr`, homepage copy, page titles, and `ServiceSchema.serviceType` to "sourcing/procurement" framing | **B — requires business approval** | This is a substantive repositioning of how the company describes itself publicly, not a technical fix. It touches metadata, structured data, and visible homepage copy simultaneously — should be approved as one coordinated change, not landed piecemeal, to avoid a mid-transition state where some pages say "supplier" and others say "sourcing company" (which would itself create the conflicting-entity problem this phase exists to prevent). |
| `HomeAndConstructionBusiness` schema type vs. missing address/geo | **B — requires business approval / owner input** | Needs a decision: either disclose a real, publicly-appropriate address/geo (if one exists and Build wants it public), or drop the `HomeAndConstructionBusiness` type and keep plain `Organization` (safer default if there's no public office to disclose). |

Neither item was implemented in this pass — both require an explicit content/business decision the brief reserves for the owner (Phase 25, Priority 4).

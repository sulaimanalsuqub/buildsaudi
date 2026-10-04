# 09 — Customization Register

> **Every non-native change to ERPNext must be listed here** (Custom Field, Property Setter,
> Client Script, Server Script, Workflow, Custom Child DocType, Custom DocType, Custom App).
> App-side code in `buildsaudi` (e.g. `lib/erpnext.ts`, matching helper) is NOT an ERPNext
> customization and is tracked in doc 03, not here.
>
> **Goal: keep this list as short as possible.** Nothing is added without first proving — in
> doc 01 — that every higher native level cannot represent the requirement correctly.

---

## Build-specific customizations (ERPNext)

_As of PHASE 0 audit (2026-10-04): **NONE.**_

The 50 Custom Fields, 189 Property Setters, and 1 Client Script present in the instance all
belong to **ksa_compliance (ZATCA) / KSA localization** and are **not** Build business
customizations. They are preserved as-is and are out of scope for this register.

| ID | Type | DocType | Field/Name | Business requirement | Why no native level works | Def (type/options) | Upgrade impact | Phase | Status |
|----|------|---------|------------|----------------------|---------------------------|--------------------|----------------|-------|--------|
| C1 | Custom Field | Quotation | `custom_business_channel` | Classify a quotation as Government (B2G) vs Commercial/Retail to drive the gov section + print format | `order_type` options (Sales/Maintenance/Shopping Cart) don't represent a sales channel; no standard channel field | Select: Commercial / Government / Retail (default Commercial) | Fixture; removable; no core change | 8 | Active |
| C2 | Custom Field | Quotation | `custom_government_tender_information` | One collapsible section to hold gov fields, shown only for B2G | grouping only | Section Break, `depends_on` channel==Government, collapsible | Fixture; removable | 8 | Active |
| C3 | Custom Field | Quotation | `custom_tender_name` | Tender/Project name on the financial proposal | no standard Quotation field (not the customer, not a project) | Data | Fixture; removable | 8 | Active |
| C4 | Custom Field | Quotation | `custom_tender_number` | Government tender number | no standard field | Data | Fixture; removable | 8 | Active |
| C5 | Custom Field | Quotation | `custom_etimad_reference` | Etimad reference number | no standard field | Data (optional) | Fixture; removable | 8 | Active |
| C6 | Custom Field | Quotation | `custom_execution_period` | Delivery/execution period | no standard field | Data | Fixture; removable | 8 | Active |
| C7 | Custom Field | Quotation | `custom_scope_of_supply` | Scope (Supply/… /+Installation) | defined enum with no standard equivalent; §10 allows showing it | Select (4 options) | Fixture; removable | 8 | Active |
| C8 | Print Format | Quotation | `Build \| Government Project Quotation` | Official Arabic RTL financial proposal for government tenders | B2B/standard formats are not suitable for gov submission | Custom Jinja, standard=No, separate from B2B | Removable; B2B formats untouched | 8 | Active |
| C9 | Terms & Conditions | — | `Build \| Government Tender Terms` | Conservative gov terms (never B2B defaults) | master data, not a customization of core | master row | Removable | 8 | Active |
| C10 | Opportunity Type | — | `Government Tender` | Classify gov opportunities (standard master) | native master | master row | Removable | 8 | Active |

> **Build-specific ERPNext customizations = 7 Custom Fields (C1–C7, all on Quotation, one section) + 1 custom Print Format (C8).**
> C9/C10 are native master rows, not customizations. No Custom DocType, no Server/Client Script, no core edit. All removable, upgrade-safe. (Migration PHASES 1–7 added **zero**; all B2G customizations are additive and isolated to the government-quotation path.)

### Removal (if ever needed)
Delete Custom Fields `Quotation-custom_*` (C1–C7), the Print Format `Build | Government Project Quotation` (C8), and optionally the Terms/Opportunity Type rows. Nothing else references them; B2B quotations and all migration flows are unaffected.

---

## Pending candidates (NOT yet created — require approval + doc-01 justification)

These are flagged in doc 01 as *Maybe*. They move into the table above only if investigation
in their phase proves native/config cannot do the job.

| Ref | Candidate | Phase | Gate before creating |
|-----|-----------|-------|----------------------|
| cap #5 | `Project` site-location field | PHASE 2 | prove Address link / existing fields insufficient |
| cap #11 | `Supplier` lifecycle `Select` field | PHASE 3 | prove Tags + `disabled` insufficient |
| cap #17 | RFQ correlation-token field | PHASE 4 | prove native `Request for Quotation Supplier` access token insufficient |
| cap #44 | Approval `Workflow` (e.g. PO > 100k SAR) | PHASE 5 | only when a real approval threshold is confirmed |

---

## Change log

| Date | Change | By |
|------|--------|-----|
| 2026-10-04 | Register created at PHASE 0. Build customizations = 0. | Claude Code |
| 2026-10-04 | PHASE 1 masters created (Item Groups, Service Items, warehouse, Workspace). **All native — zero customizations added.** Build customization count remains **0**. | Claude Code |
| 2026-10-04 | PHASE 2 (`/get-quote`→ERPNext) implemented app-side only (`lib/erpnext*.ts`). Customer linkage via native **Project** (candidate cap #5 for a Project site-location field still deferred, not created). **Zero ERPNext customizations added.** Count remains **0**. | Claude Code |
| 2026-10-04 | PHASE 3 (`/register`→ERPNext) implemented app-side. Supplier lifecycle via Tags+`disabled`+`prevent_rfqs` (cap #11 custom field NOT created); capabilities via native **Party Specific Item**; +2 Item Groups (Wall Finishes, Adhesives & Sealants). **Zero ERPNext customizations added.** Count remains **0**. | Claude Code |
| 2026-10-04 | PHASE 4 (RFQ inbound→Draft Supplier Quotation) implemented app-side (`lib/erpnext-rfq.ts`). Correlation token (cap #17 custom field NOT created — signed token used instead); native Supplier Quotation + native Comparison report. **Zero ERPNext customizations added.** Count remains **0**. | Claude Code |
| 2026-10-04 | PHASE 5 (Quotation→SO→PO) verified native (margin via Quotation Item margin_type; PO split by supplier). Config: enabled `is_purchase_item=1` on 6 `BUILD-*` service items. PHASE 6 fulfilment routes confirmed native (Drop Ship/PR/DN/Landed Cost/Transit/Delivery Trip). **Zero ERPNext customizations added.** Count remains **0**. | Claude Code |
| 2026-10-04 | PHASE 8 (B2G Government Project Quotation) added the **first** Build customizations: 7 Custom Fields on Quotation (C1–C7, one B2G-only section) + 1 custom Print Format (C8) + gov Terms template (C9) + Opportunity Type (C10). All upgrade-safe, removable, isolated to the gov path; B2B unaffected. Count: **7 Custom Fields + 1 Print Format**. | Claude Code |

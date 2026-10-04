# 07 — Testing

> All automated + live tests run during the migration. Live tests ran against
> `buildsaudi.k.frappe.cloud` and **cleaned up after themselves** (instance left clean: 0 business
> records; only PHASE-1 masters + PHASE-8 gov customizations persist).

## Automated (unit) — `node --test` on `lib/*.test.ts`
| Suite | Tests | Covers |
|---|---:|---|
| `lib/erpnext-supply-request.test.ts` | 8 | fresh request→MR, item reuse, duplicate-customer dedup, company type, 5xx→network, 4xx→validation, timeout, empty-lines guard |
| `lib/erpnext-vendor-registration.test.ts` | 5 | Supplier+Contact+capabilities, idempotency, contact-dedup, invalid category, international/no-SAR |
| `lib/erpnext-rfq.test.ts` | 6 | correlation round-trip + tamper reject, unmatched/unknown-RFQ/wrong-supplier guards, attachment-only→RFQ note |

Run: `npm test`. Result: all new suites green. One **pre-existing, unrelated** failure remains in
`lib/shared-store.test.ts` ("production refuses … without shared Redis") — fails on a clean checkout
too (local env), not touched by this work. `npx tsc --noEmit` and `eslint` are clean.

## Live end-to-end (then cleaned up)
| Phase | What was exercised | Result |
|---|---|---|
| 2 | `/get-quote` → Customer + Project + Items(Needs Review) + **Draft Material Request**; Project linkage; UOM mapping (قطعة→Nos, متر→Meter); Comment; (discovered & fixed: MR.customer cleared for Purchase → use Project) | ✅ |
| 3 | `/register` → Supplier (Company/Distributor/SAR/disabled/prevent_rfqs) + Contact + 4 Party Specific Items + `build:pre-onboarding` tag | ✅ |
| 4 | real RFQ (Draft) + correlation round-trip + **Draft Supplier Quotation** from a parsed reply (rates, RFQ links, valid_till, Comment) | ✅ |
| 5 | Quotation with **15% margin → rate 115**, service line; Sales Order; **PO split by supplier** (enabled `is_purchase_item` on service items) | ✅ |
| 6 | fulfilment doctypes/fields confirmed present (Drop Ship, Purchase Receipt, Delivery Note, Landed Cost, Transit, Delivery Trip, is_transporter) — stock-posting e2e deferred to a test site (perpetual inventory → GL) | ✅ (capability) |
| 8 | Government Quotation (10 BOQ lines, 15% VAT, 5% discount, **grand 1,884,562.5**), **valid PDF** via gov print format (multi-page, long desc, RTL); no-Etimad variant; gov Terms (no B2B); Quotation→Sales Order; **B2B standard print format unaffected** | ✅ |

## Not run on production (by policy — spec §36/§46)
- No Sales Invoice / Purchase Invoice / Payment Entry (GL postings).
- No submitted Purchase Receipt / Delivery Note / Stock Entry (GL under perpetual inventory).
- No ZATCA onboarding. These belong to the gated accounting phase (doc 07-zatca) / a test site (doc 08).

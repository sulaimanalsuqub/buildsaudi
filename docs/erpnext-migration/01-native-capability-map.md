# 01 — Native Capability Map (NATIVE-CAPABILITY-AUDIT)

> For every business requirement: the native ERPNext feature, current config, the gap,
> the required action, and whether any customization is needed (with reason).
>
> **Governing rule (spec §2):** Native feature → standard field → existing master/child/link
> → Supplier Group/Item Group/Brand/Tags → Party Specific Item → Workflow/Assignment/ToDo
> → Standard Report → **Custom Field** → tiny script → Custom Child → Custom DocType → Custom App.
> Never descend a level without proving the higher level cannot represent the need correctly.
>
> Legend — **Customization?**: `No` = pure native/config · `Maybe` = investigate in its phase,
> propose in doc 09 before building · `Helper` = small app-side code in `buildsaudi` (not an ERPNext customization).

---

## A. Customer intake & masters

| # | Requirement | Native feature | Current config | Gap | Required action | Custom? | Reason |
|---|---|---|---|---|---|---|---|
| 1 | Customer "Supply Request" (طلب توريد) intake | **Material Request** (Purpose = *Purchase*) | none | no intake yet | PHASE 2: `/api/quotes/register` creates Material Request | **No** | MR is the native start of procurement; business name stays website-only (spec §4) |
| 2 | Customer-facing tracking reference | **Naming Series** on Material Request | default `MAT-MR-.YYYY.-` | confirm series is customer-safe | reuse MR `name` as the tracking number (spec §5) | **No** | avoid a parallel numbering system |
| 3 | De-duplicate customer / contact / address | **Customer + Contact + Address** (Dynamic Links) | 0 records | lookup-before-create logic | PHASE 2 helper: search by phone/email/tax id, link Contact/Address | **Helper** | dedup is app-side query over native masters; no new fields |
| 4 | Company vs individual customer | **Customer Type** (Company/Individual) + Customer Group | groups exist | map intake field | set Customer Type + Group on create | **No** | native field |
| 5 | Project name + site location | **Project** (links Customer, Sales, Purchase, costs) | 0 projects | Project has no native "site location/GPS" field | PHASE 2: create/reuse Project by Customer+name; **location** → investigate (Address link vs field) | **Maybe** | decide in PHASE 2; document gap before any field |
| 6 | Product master | **Item** (+ UOM, Manufacturer, Item Price, supplier codes) | 0 items | taxonomy + matching | PHASE 1 taxonomy; PHASE 2 extract→match→reuse→create | **No** | Item is the only product master (spec §8) |
| 7 | "Needs Review" for low-confidence items | **Tags** (`_user_tags`) or an Item Group bucket | n/a | none | tag new/low-confidence Items `Needs Review` | **No** | native tags; no Item Status field (spec §8) |
| 8 | Item taxonomy (building materials) | **Item Group tree** (nested set) | generic demo tree | no Building Materials hierarchy | PHASE 1: build extensible tree (Plumbing › Sanitaryware › Mixers › …) | **No** | native tree scales to thousands |
| 9 | Brands | **Brand** master | 0 brands | none | create Brands only when confidently known | **No** | native; key for matching (spec §10) |

## B. Suppliers

| # | Requirement | Native feature | Current config | Gap | Required action | Custom? | Reason |
|---|---|---|---|---|---|---|---|
| 10 | Supplier master (one record for life) | **Supplier** (+ Contact, Address) | 0 suppliers | none | PHASE 3: `/api/vendors/register` → Supplier + Contact + Address | **No** | spec §11 — no Vendor/Lead/Onboarding entities |
| 11 | Supplier lifecycle (Pre-Onboarding→…→Inactive) | **Tags** + **`disabled`** flag (+ optional Workflow) | n/a | states not modeled | PHASE 3: tags `build:pre-onboarding…build:active…`; `disabled=1` = not RFQ-eligible | **Maybe** | start with tags+disabled (spec §12); only if insufficient, propose ONE custom `Select` field in doc 09 |
| 12 | Supplier ↔ Brand / Category capability | **Party Specific Item** (Party=Supplier → Item / Item Group / Brand) | DocType present, 0 rows | capabilities not recorded | PHASE 3: write Party Specific Item rows per supplier capability | **No** | native construct exists for exactly this (spec §13) |
| 13 | Supplier matching + ranking (Brand AND Item Group, hierarchy-aware) | **RFQ "Get Suppliers"**, Supplier Group, Tags, Party Specific Item, Saved Filters | n/a | native "Get Suppliers" ranks by group, not Brand×Group with parent/child logic | PHASE 4: if native filter insufficient → tiny read-only helper returning *Recommended Suppliers* | **Helper** | no Matching Module/DocType; helper only ranks, never auto-sends (spec §14) |
| 14 | Supplier scorecard | **Supplier Scorecard** | not configured | deferred | PHASE 4+: enable later for response/delivery/quality | **No** | native; no custom rating system (spec §22) |

## C. RFQ & supplier quotation

| # | Requirement | Native feature | Current config | Gap | Required action | Custom? | Reason |
|---|---|---|---|---|---|---|---|
| 15 | RFQ to multiple suppliers, multi-item, split by category | **Request for Quotation** | none | none | PHASE 4: create RFQ from Material Request; split into several RFQs where needed | **No** | spec §16 |
| 16 | No supplier portal; email out via Resend | RFQ + **Resend** (existing) instead of Website Users | Resend present | native RFQ emails via portal users | PHASE 4: ERPNext RFQ = source of truth; outbound via buildsaudi+Resend with RFQ PDF | **No** | spec §17 — avoid portal users |
| 17 | RFQ email correlation token | Subject token `[RFQ-xxxxx][ref:xyz]` + RFQ Supplier child | app-side token exists today | map token→RFQ+Supplier reliably | PHASE 4: reuse `Request for Quotation Supplier` access token or app map; keep idempotency/replay | **Maybe** | prefer native RFQ-Supplier token; propose field only if none fits (doc 09) |
| 18 | Supplier reply → Draft Supplier Quotation (no auto-submit) | **Supplier Quotation** (Draft) | none | intake wired to Odoo today | PHASE 4: `lib/quote-intake.ts`+`/api/rfq/inbound-email` → create **Draft** Supplier Quotation in ERPNext | **No** | spec §19; staff submits manually |
| 19 | Attachment-only / low-confidence reply | **File attach** + **ToDo/Comment** | n/a | none | attach to RFQ/SQ + create review ToDo; never guess | **No** | native assignment/attachment |
| 20 | Supplier Quotation fields | **Supplier Quotation** (rate, qty, valid till, taxes, terms, currency) | none | none | map native fields; attach supplier's original | **No** | spec §20 |
| 21 | Supplier Quotation comparison, item-by-item | **Supplier Quotation Comparison** report | available | none | PHASE 4: use native report; pick Item→Supplier per line, no auto-award | **No** | spec §21 |

## D. Customer quotation → order → purchase

| # | Requirement | Native feature | Current config | Gap | Required action | Custom? | Reason |
|---|---|---|---|---|---|---|---|
| 22 | Customer Quotation | **Quotation** | none | none | PHASE 5 | **No** | spec §23 |
| 23 | Build margin (not commission) | **Quotation/SO item Margin** (% or amount) + Pricing Rule | none | none | apply margin in Quotation; never expose cost/margin on supplier docs | **No** | spec §24 |
| 24 | Logistics / handling / cross-dock / storage costs | **Service Items** + Taxes & Charges + Shipping Rule | 0 service items | create service items | PHASE 1/5: Items `Procurement Service, Logistics, Delivery, Handling, Cross-Docking, Temporary Storage` | **No** | native service items (spec §23) |
| 25 | Customer approval → commitment | **Sales Order** (from Quotation) | none | none | PHASE 5 | **No** | spec §25 |
| 26 | Purchase split per supplier | **Purchase Order** (one per Supplier) | none | none | PHASE 5: SQ→PO, split by supplier | **No** | spec §26 |

## E. Fulfilment, logistics, payments, invoicing

| # | Requirement | Native feature | Current config | Gap | Required action | Custom? | Reason |
|---|---|---|---|---|---|---|---|
| 27 | Direct supplier → customer | **Drop Shipping** (SO item "Delivered By Supplier" → PO) | available | none | PHASE 6 route A; no fake Purchase Receipt | **No** | spec §27A |
| 28 | Supplier → 3PL/cross-dock → customer | **Purchase Receipt → Warehouse → Delivery Note** | transit WH exists | add a consolidation WH only if needed | PHASE 6 route B | **No** | spec §27B |
| 29 | Multi-supplier consolidation + partial | **Purchase Receipt / Delivery Note** (partial supported) | native | none | PHASE 6 route C | **No** | spec §27C |
| 30 | Temporary storage (≤30d) | **Warehouse + Stock Ledger / ageing reports** | native | none | no WMS build; use ageing reports | **No** | spec §28 |
| 31 | Goods in transit | **Stock Entry (Material Transfer / Add to Transit)** + Transit WH | `Goods In Transit - EFAD` exists | none | use native transit only for real moves | **No** | spec §29 |
| 32 | Transporter / carrier | **Supplier + Transporter role** + Delivery Note transporter fields | carrier flow is Odoo-coupled today | fold carriers into Supplier model | later: map carrier → Supplier(+Transporter); legacy carrier flow deprecates | **No** | spec §30; no custom transporter master |
| 33 | Delivery (incl. partial, multi) | **Delivery Note** (many per SO) | none | none | PHASE 6 | **No** | spec §31 |
| 34 | Delivery routing / stops | **Delivery Trip** | none | none | optional later | **No** | spec §32; no custom route mgmt |
| 35 | International procurement | **Incoterm + Named Place** (RFQ/Quotation/PO) + **Landed Cost Voucher** | native | none | use when goods enter Build/3PL stock | **No** | spec §33 |
| 36 | Payments (advance/partial/multi-alloc) | **Payment Entry** | native | none | keep native; link advances to SO/PO | **No** | spec §34 |
| 37 | Invoices (buy & sell in Build's name) | **Purchase Invoice** / **Sales Invoice** | native | none | PHASE 5+ | **No** | spec §35 — Build is principal, not commission |
| 38 | ZATCA / VAT / CoA | **ksa_compliance** (installed) | present; `tax_id` empty | audit-only now | **PHASE 7 only**, with explicit approval; no live doc submit for tests | **No** | spec §36 |

## F. Website, workspace, integration

| # | Requirement | Native feature | Current config | Gap | Required action | Custom? | Reason |
|---|---|---|---|---|---|---|---|
| 39 | `/ar/register` supplier registration | Supplier + Contact + Address + Party Specific Item | Odoo-coupled | swap backend | PHASE 3: same form/UX; backend→ERPNext | **No** | spec §37 |
| 40 | `/ar/track-request` tracking | Map ERPNext doc status → safe customer status | Odoo-coupled | status mapping | PHASE 2/4: read ERPNext; hide supplier cost/identity/margin/notes | **Helper** | spec §40; no duplicate op DB |
| 41 | Email (confirm/RFQ/reminders/inbound) | **Resend** (existing) | present | none | keep Resend; ERPNext = doc source of truth | **No** | spec §41 |
| 42 | WhatsApp | — (deferred) | n/a | out of scope now | design so it can attach later w/o data-model change | **No** | spec §42 |
| 43 | Workspace "Build Procurement" | **Workspace** (links/shortcuts/number cards to native DocTypes) | none | none | PHASE 1: build workspace; simplify (hide Mfg/Assets/Subcontracting/Quality from daily view) | **No** | spec §43–44 |
| 44 | Approvals (e.g. PO > 100k SAR) | **Workflow** (only where a real approval exists) | 0 workflows | none | add only when needed | **Maybe** | spec §45; propose in doc 09 if added |
| 45 | Single ERPNext integration client | `lib/erpnext.ts` (auth, timeouts, safe errors, idempotency, CRUD, attach) | missing | none | PHASE 2: build once; no per-route fetch | **Helper** | spec §39; app-side, least-privilege service user |

---

## Summary of non-native candidates (to watch)

Only these may ever need more than native/config — each must be justified in **doc 09**
before building, and only after proving the higher level fails:

- **#5** Project site location field (if Address link insufficient)
- **#11** Supplier lifecycle single `Select` field (if Tags+disabled insufficient)
- **#17** RFQ correlation token field (if native RFQ-Supplier token insufficient)
- **#44** Approval Workflow(s) (where a real approval threshold exists)

Everything else is **native feature + configuration** or **app-side helper in buildsaudi**
(which is not an ERPNext customization). Target: keep the ERPNext customization register
as close to empty as possible.

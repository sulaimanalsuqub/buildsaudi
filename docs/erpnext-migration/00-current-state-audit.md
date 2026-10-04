# 00 — Current State Audit (PHASE 0)

> Read-only audit. No writes were made to ERPNext and no repo files were modified
> other than creating this `docs/erpnext-migration/` folder.
>
> Date: 2026-10-04 · Auditor: Claude Code · Scope: ERPNext instance + `buildsaudi` repo

---

## 1. ERPNext Instance

| Item | Value |
|---|---|
| URL | `https://buildsaudi.k.frappe.cloud` |
| Logged-in service user | `sulaiman@build.sa` (System Manager — see note) |
| Frappe | **16.33.1** |
| ERPNext | **16.34.2** (latest v16 line) |
| ksa_compliance (ZATCA) | **0.61.4** — installed ✅ |
| email_delivery_service | 0.0.1 |
| Enabled domains | none explicitly set (generic ERPNext) |

### 1.1 Company & Accounting defaults

| Setting | Value | Note |
|---|---|---|
| Company | **`EFAD FOR MARKETING`** (abbr `EFAD`) | ⚠️ Not named "Build" — see GAP-01 |
| Country | Saudi Arabia |
| Default currency | SAR |
| Chart of Accounts | Standard with Numbers |
| Perpetual Inventory | Enabled (`enable_perpetual_inventory=1` on Company) |
| `tax_id` (VAT) | **empty** — see GAP-02 |

### 1.2 Settings snapshots (key fields only)

**Selling Settings** — `cust_master_name=Customer Name`, `selling_price_list=Standard Selling`,
`so_required=No`, `allow_multiple_items=1`.

**Buying Settings** — `supp_master_name=Supplier Name`, `buying_price_list=Standard Buying`,
`po_required=No`, `maintain_same_rate=1`.

**Stock Settings** — `item_naming_by=Item Code`, `valuation_method=FIFO`,
`default_warehouse=Stores - EFAD`, `allow_negative_stock=0`, `auto_insert_price_list_rate_if_missing=1`.

**Accounts Settings** — `determine_address_tax_category_from=Billing Address`,
`over_billing_allowance=0`, `acc_frozen_upto=none`.

### 1.3 Master data — current state (counts)

| Master | Count | Notes |
|---|---:|---|
| Customer | **0** | clean slate |
| Supplier | **0** | clean slate |
| Item | **0** | clean slate |
| Brand | **0** | clean slate |
| Item Group | 6 | ERPNext demo tree (see below) — no building-materials taxonomy yet |
| Warehouse | 5 | ERPNext demo warehouses (EFAD abbr) |
| Price List | 2 | Standard Selling (SAR), Standard Buying (SAR) |
| Supplier Group | 8 | some generic groups present |
| Customer Group | 5 | Commercial / Government / Individual / Non Profit |
| Payment Term | 0 | none defined |
| Shipping Rule | 0 | none defined |
| UOM | 239 | full default set |
| Territory | 3 | All / Saudi Arabia / Rest Of The World |
| Party Specific Item | 0 | native DocType available, unused |
| Project | 0 | none |

**Item Group tree (current):**
```
All Item Groups
├── Consumable
├── Products
├── Raw Material
├── Services
└── Sub Assemblies
```
→ Generic ERPNext defaults. No `Building Materials` hierarchy. (PHASE 1 target.)

**Warehouses (current):**
```
All Warehouses - EFAD (group)
├── Finished Goods - EFAD
├── Goods In Transit - EFAD   (warehouse_type = Transit)  ← useful native transit WH
├── Stores - EFAD             (default)
└── Work In Progress - EFAD
```

**Supplier Groups:** All Supplier Groups › Distributor, Electrical, Hardware, Local,
Pharmaceutical, Raw Material, Services.

**Customer Groups:** All Customer Groups › Commercial, Government, Individual, Non Profit.

### 1.4 Customizations present

| Type | Count | Build-specific? | Notes |
|---|---:|---|---|
| Custom Field | 50 | **No** | All ZATCA/KSA-localization (`custom_zatca_*`, VAT reg no., building number, tax category, prepayment, POS/SI tax fields). Shipped/driven by `ksa_compliance`. |
| Property Setter | 189 | **No** | Form-layout tweaks across Sales/Purchase/Delivery/Payment doctypes — localization driven. Not Build business logic. |
| Client Script | 1 | No | "Email account won't work warning" (Email Account form) — unrelated. |
| Server Script | 0 | — | none |
| Workflow | 0 | — | none |
| Custom DocType | 0 | — | **none** |

➡️ **There are ZERO Build-specific customizations in ERPNext today.** The Build
customization register (doc 09) therefore starts empty. Everything non-standard
present is ZATCA/localization and must be preserved, not touched.

---

## 2. `buildsaudi` Repository

| Item | Value |
|---|---|
| Local path | `~/buildsaudi` |
| Remote | `git@github.com:sulaimanalsuqub/buildsaudi.git` |
| Branch | `main` |
| Working tree | ⚠️ 8 uncommitted modified files (unrelated UI WIP — see note) |
| Framework | Next.js (App Router) + TypeScript |
| Tests | `node --test` on `lib/*.test.ts` (12 test files) |
| Scripts | `dev / build / start / lint / typecheck / test` |

> ⚠️ **Shared working tree:** this repo on disk is shared with a second Claude Code
> session. Do NOT switch git branches from the migration session while the other
> session is active. Migration code changes (PHASE 2+) should be coordinated or done
> on a dedicated branch only once the shared-tree conflict is resolved.

### 2.1 Integration topology (the critical finding)

There are **two distinct backend seams**, not one:

```
A) CUSTOMER QUOTE INTAKE
   build.sa/ar/get-quote
     └─ POST /api/quotes/register
          └─ fetch ${BUILD_OPT_BASE_URL}/api/public/procurement-requests   ← Build-OPT service
                 └─ (Build-OPT internally writes to Odoo)
   » Does NOT use lib/odoo.ts. PHASE 2 replaces THIS fetch seam.

B) SUPPLIER / CARRIER REGISTRATION + RFQ INTAKE
   build.sa/ar/register        → POST /api/vendors/register → lib/vendor-registration.ts → lib/odoo.ts (direct Odoo)
   RFQ inbound email           → /api/rfq/inbound-email → lib/quote-intake.ts → lib/odoo.ts (direct Odoo)
   » Talks to Odoo DIRECTLY via lib/odoo.ts. PHASE 3 & 4 replace THIS.
```

### 2.2 Dependency reference map

| Marker | Files | Meaning |
|---|---:|---|
| `odoo` (import/usage) | 40 | direct Odoo coupling (vendor/carrier/RFQ) |
| `erpnext` | **0** | no ERPNext client exists yet → PHASE 2 creates `lib/erpnext.ts` |
| `BUILD_OPT` | 3 | `app/api/quotes/register/route.ts`, `app/api/carriers/register/route.ts`, `lib/vendor-registration-route.test.ts` |
| `x_build_` (Odoo custom models) | 13 | vendor/carrier onboarding, RFQ intake, odoo-outbox cron, email |

**Build-OPT seam in `/api/quotes/register/route.ts`:**
- L104 `const baseUrl = process.env.BUILD_OPT_BASE_URL`
- L159 `res = await fetch(\`${baseUrl}/api/public/procurement-requests\`, …)`
- (235 lines total; Turnstile / idempotency / DeepSeek extraction all upstream of L159 and backend-agnostic.)

### 2.3 Key lib surface

| File | Lines | Role |
|---|---:|---|
| `lib/odoo.ts` | 3202 | Odoo JSON-RPC client + 60+ exported helpers (partners, suppliers, carriers, brands, category matching, `createBuildAiTask`, matching suppliers/carriers). Imported by ~17 files. |
| `lib/vendor-registration.ts` | 207 | Supplier registration orchestration (Odoo IDs: currency/payment-term/incoterm, category_names). |
| `lib/quote-intake.ts` | 121 | RFQ reply → Odoo (`createSupplierQuote`, `x_build_ai_communication`, `checkAndTriggerWinnerSelection`). |
| `lib/resend-inbound.ts` | — | Resend inbound-email handling (+ test). |
| `lib/turnstile.ts` | — | Cloudflare Turnstile verification. |
| `lib/material-extraction.ts` / `lib/quote-extraction.ts` | — | DeepSeek (`deepseek-v4-flash`) line-item extraction (text/PDF-text/CSV; no vision). |
| `lib/email.ts` | — | Resend outbound. |
| `lib/inbound-webhook-policy.ts` | — | replay/idempotency policy for inbound. |

### 2.4 Existing docs (prior history)

`docs/odoo-migration/` (phase-2a reports) and `docs/direct-odoo-supplier-registration.md`
confirm the stated history: **ERPNext → Odoo → Build-OPT → (now) back to ERPNext.**

### 2.5 Environment variables in use (examples)

Odoo: `ODOO_BASE_URL`, `ODOO_DATABASE`, `ODOO_USERNAME`, `ODOO_API_KEY` (+ timeout/retries).
Other: `BUILD_OPT_BASE_URL`, `PUBLIC_INTAKE_SERVICE_SECRET`, `RESEND_API_KEY`, `DEEPSEEK_API_KEY`,
Turnstile keys. → PHASE 2 adds `ERPNEXT_BASE_URL`, `ERPNEXT_API_KEY`, `ERPNEXT_API_SECRET`.

---

## 3. Gaps register (from audit)

| ID | Gap | Severity | Decision owner | Phase |
|---|---|---|---|---|
| GAP-01 | ~~ERPNext Company is `EFAD FOR MARKETING`, not a Build entity.~~ **RESOLVED 2026-10-04 (by design):** EFAD FOR MARKETING is the legal entity behind Build and stays as the ERPNext Company. Instance is **Build-only** (single operating brand); no Company "Build", no rename, no multi-brand split, no Build-vs-EFAD cost centers. "Build" is the operating brand used only in Workspace / emails / Letter Heads / Print Formats / customer-facing docs. | — | Resolved | — |
| GAP-02 | Company `tax_id` (VAT) empty — required for ZATCA live invoicing. | High | User | PHASE 7 |
| GAP-03 | No `lib/erpnext.ts` client exists. | Expected | — | PHASE 2 |
| GAP-04 | Item Group tree is generic; no Building Materials taxonomy. | Medium | native config | PHASE 1 |
| GAP-05 | No Payment Terms / Shipping Rules / logistics Service Items. | Medium | native config | PHASE 1 / 5 |
| GAP-06 | Two legacy seams (Build-OPT for quotes, Odoo-direct for vendors/RFQ) must be cut over independently. | Expected | — | PHASE 2–4 |
| GAP-07 | Shared working tree with second session blocks branch switching. | Process | User | now |
| GAP-08 | Service account uses `sulaiman@build.sa` (System Manager). Spec §39 wants a least-privilege service user. | Medium | User | PHASE 2 |

---

## 4. PHASE 0 conclusion

- ERPNext is a **clean, latest-v16 instance** with ZATCA pre-installed and **no Build
  customizations** — ideal for a native-first rebuild.
- The repo's coupling is **Odoo + Build-OPT**, zero ERPNext. Cutover is two independent
  seams (quotes via Build-OPT; vendors/RFQ via direct Odoo).
- No irreversible/accounting/ZATCA/custom-app action was taken or is required in PHASE 0.

➡️ Proceed to **PHASE 1 (ERPNext masters + native configuration)** — all additive,
reversible, native. See `01-native-capability-map.md` for the per-requirement plan and
`09-customization-register.md` (currently empty) for governance of any non-native change.

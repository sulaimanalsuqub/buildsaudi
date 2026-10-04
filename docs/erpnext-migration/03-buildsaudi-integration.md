# 03 — buildsaudi ↔ ERPNext Integration

> The single integration layer between the Next.js app and ERPNext, and the per-phase
> wiring of each website seam. App-side helpers here are NOT ERPNext customizations.

---

## 1. The single client — `lib/erpnext.ts`

One client for all ERPNext access (spec §39). No route builds its own `fetch`.

- **Auth:** token-based header `Authorization: token <key>:<secret>` (Frappe REST).
- **Config (env):** `ERPNEXT_BASE_URL`, `ERPNEXT_API_KEY`, `ERPNEXT_API_SECRET`,
  optional `ERPNEXT_COMPANY` (default `EFAD FOR MARKETING`), `ERPNEXT_REQUEST_TIMEOUT` (15s).
  Secrets live only in env — never committed, never logged.
- **`isErpnextConfigured()`** — feature switch: when true the app uses ERPNext; otherwise
  it falls back to the legacy Build-OPT path (safe rollback, spec §48).
- **Errors:** `ErpnextClientError { kind, retryable, correlationId, status, publicMessage }`
  mirroring `OdooClientError`. `kind ∈ network|timeout|validation|auth|permission|conflict|not_found|unknown`.
  Frappe `_server_messages`/`exc_type` parsed into a safe message; no stack traces leaked.
- **Helpers:** `getList`, `getDoc`, `docExists`, `createDoc`, `updateDoc`, `callMethod`,
  `addTag`, `addComment`, `uploadFileToDoc`, `erpnextCompany`.

## 2. Seam cutover plan

| Phase | Website seam | Route / lib | From | To |
|---|---|---|---|---|
| **2 ✅** | `/ar/get-quote` | `app/api/quotes/register/route.ts` | `fetch BUILD_OPT_BASE_URL/api/public/procurement-requests` | `lib/erpnext-supply-request.ts` → Material Request |
| 3 | `/ar/register` | `app/api/vendors/register` + `lib/vendor-registration.ts` | direct Odoo (`lib/odoo.ts`) | `lib/erpnext.ts` → Supplier + Contact + Address + Party Specific Item |
| 4 | RFQ inbound | `app/api/rfq/inbound-email` + `lib/quote-intake.ts` | direct Odoo | `lib/erpnext.ts` → Draft Supplier Quotation |

`lib/odoo.ts` and Build-OPT code remain until each replacement is tested + preview-verified +
production-parity confirmed. Cleanup is a final, separate step (spec §38).

---

## 3. PHASE 2 — `/get-quote` → ERPNext (DONE)

### 3.1 What changed
- **New:** `lib/erpnext.ts` (client), `lib/erpnext-supply-request.ts` (domain mapping),
  `lib/erpnext-supply-request.test.ts` (8 unit tests).
- **Edited:** `app/api/quotes/register/route.ts` — backend destination only. Everything
  above the destination is **unchanged**: Turnstile, zod validation, file validation,
  rate limiting, idempotency (`claimSubmission`/submission_id/replay), DeepSeek extraction,
  success/tracking response shape. UI/UX untouched (spec §5).
- **Edited:** `.env.local.example` — documented `ERPNEXT_*`.

### 3.2 Flow (`createSupplyRequestInErpnext`)
```
1. Customer  — dedup lookup-before-create:
     a) find Contact by email → else by mobile → follow Dynamic Link to its Customer
     b) else find Customer by customer_name
     c) else create Customer (Company+Commercial if legalName, else Individual+Individual; territory=Saudi Arabia)
     + ensure Contact (email/phone, linked) + Address (Shipping, linked); set as customer primary (best-effort)
2. Project   — find by (customer, project_name) → else create {project_name, company, customer, status:Open}
3. Items     — per line: match existing Item by item_name → reuse;
               else create Item (item_group="Needs Review", UOM mapped, is_stock/purchase/sales) + tag "Needs Review";
               brand kept as free text in description (no auto Brand creation — spec §8/§10)
4. Material Request (Purpose=Purchase, DRAFT) — items carry {qty, schedule_date, uom, project};
               operational notes (project/notes/submission_id) added as a native Comment;
               customer files attached to the MR (best-effort, non-fatal)
```
**Tracking number = Material Request name** (naming series `MAT-MR-.YYYY.-`) — no parallel numbering (spec §5).

### 3.3 Key design decision — customer linkage via Project (not MR.customer)
`Material Request.customer` has `depends_on: material_request_type=="Customer Provided"`, so ERPNext
**clears it for Purpose=Purchase** (verified live). The native, persistent way to tie a purchase
request to a customer is **Project** (`Project.customer` + `Material Request Item.project`), which also
unlocks native profitability tracking (spec §7). We reuse a Project per (customer + project_name).

### 3.4 UOM mapping
Free-text units → standard UOM; unknown → `Nos` with the original unit preserved in the item
description. Verified live: `قطعة→Nos`, `متر→Meter`.

### 3.5 Error → HTTP mapping (route)
`ErpnextClientError` → timeout `504` · network `503` · validation/conflict `400` ·
auth/permission/not_found/unknown `502`. User sees `publicMessage` (Arabic), never internals.
Failed submissions recorded via `saveSubmissionState` with correlationId.

### 3.6 Verification
- `npx tsc --noEmit` → clean. `eslint` → clean. `npm test` → 8/8 new tests pass
  (fresh request, item reuse, duplicate-customer dedup, company type, 5xx→network,
  4xx→validation, timeout, empty-lines guard). (One unrelated pre-existing failure in
  `shared-store.test.ts` about Redis/production — not touched here.)
- **Live end-to-end** against `buildsaudi.k.frappe.cloud`: created Customer + Project +
  2 Items (Needs Review) + Draft Material Request; confirmed `MR.items[].project=PROJ-xxxx`,
  `Project.customer` set, UOM mapping, Comment attached. All test records cleaned up
  afterwards (instance left clean: 0 customers/suppliers/projects/MRs; 6 service Items from PHASE 1).

### 3.7 Not yet done / gates before production
- **GAP-08:** replace the System-Manager API key with a **least-privilege ERPNext API User**
  (Purchase/Sales/Stock) + rotate the key currently used for dev. Set `ERPNEXT_*` in Vercel.
- Production stays on Build-OPT until preview parity is signed off; flipping `ERPNEXT_BASE_URL`
  in an environment switches that environment to ERPNext (and omitting it rolls back).
- No ERPNext customizations were added (register remains empty).

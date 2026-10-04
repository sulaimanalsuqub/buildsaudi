# 02 — Target Architecture + PHASE 1 Configuration Record

> The native end-state design (what maps to what), plus a record of the masters/config
> created in PHASE 1. Everything in PHASE 1 is **additive and reversible**.

---

## 1. Native document flow (end state)

```
Customer "Supply Request" (طلب توريد)  ── website term only ──┐
                                                              ▼
build.sa/ar/get-quote → /api/quotes/register → ERPNext:
    Customer (+ Contact + Address)                [dedup: lookup-before-create]
    Items (match existing → reuse → else create; tag "Needs Review" if low-confidence)
    Material Request (Purpose = Purchase)          ← customer-facing tracking no. = MR name
                                                              │
                      staff recommends suppliers (helper) + selects manually
                                                              ▼
    Request for Quotation (1..n, split by trade/category; multi-supplier, multi-item)
        └─ outbound via buildsaudi + Resend (NO supplier portal), subject token [RFQ-xxxx][ref:yyy]
                                                              │
                      supplier reply email → Resend inbound → /api/rfq/inbound-email
                                                              ▼
    Supplier Quotation (DRAFT, never auto-submit)  ← attach supplier's original file
        └─ Supplier Quotation Comparison (native report) → pick Item→Supplier per line
                                                              ▼
    Quotation (to customer)  = supplier cost + logistics service items + margin (native)
                                                              ▼  customer approves
    Sales Order  (customer commitment)
                                                              ▼
    Purchase Order(s)  — one per Supplier
                                                              ▼  fulfilment (3 native routes)
    A) Drop Ship: SO item delivered-by-supplier → PO → (no Build stock)
    B) Cross-dock: PO → Purchase Receipt → "Build 3PL Consolidation" WH → Delivery Note
    C) Consolidation: multi-supplier Purchase Receipts → WH → partial Delivery Notes
                                                              ▼
    Sales Invoice (Build → customer) / Purchase Invoice (supplier → Build) / Payment Entry
                                                              ▼
    ZATCA e-invoicing via ksa_compliance   ← PHASE 7, separate, with approval
```

## 2. Master → native-construct mapping

| Concept | Native construct |
|---|---|
| Product | **Item** (+ Brand, Item Group, UOM, Item Price, supplier codes) |
| Taxonomy | **Item Group** tree (Building Materials …) |
| Supplier | **Supplier** (+ Contact, Address) |
| Supplier capability (brand/category) | **Party Specific Item** (Supplier → Item / Item Group / Brand) |
| Supplier lifecycle | **Tags** + `disabled` (see §4) |
| Transporter/carrier | **Supplier + Transporter role** |
| Logistics/margin lines | **Service Items** + Quotation Margin + Taxes & Charges + Shipping Rule |
| Project | **Project** (Customer + name; location TBD, see cap #5) |
| Customer tracking no. | **Material Request** naming series |

## 3. buildsaudi integration seams (see doc 03 for detail)

- **PHASE 2** — replace Build-OPT seam in `/api/quotes/register` (`fetch BUILD_OPT_BASE_URL/...`)
  with a call to a new single client `lib/erpnext.ts` that creates Customer/Items/Material Request.
- **PHASE 3** — replace direct-Odoo calls in `lib/vendor-registration.ts` (`/api/vendors/register`)
  with `lib/erpnext.ts` → Supplier + Contact + Address + Party Specific Item.
- **PHASE 4** — replace direct-Odoo calls in `lib/quote-intake.ts` + `/api/rfq/inbound-email`
  with `lib/erpnext.ts` → Draft Supplier Quotation; keep Resend + correlation token + idempotency.
- `lib/odoo.ts` and Build-OPT code stay until each replacement is tested + preview-verified +
  production-parity confirmed (spec §38). Cleanup is a final, separate step.

---

## 4. Supplier lifecycle — Tag + `disabled` convention (no custom field)

States modeled with native **Tags** (created automatically on first use — nothing to pre-create):

| Business state | Tag | `disabled` | RFQ-eligible? |
|---|---|---|---|
| Pre-Onboarding | `build:pre-onboarding` | 1 | No |
| Contacted | `build:contacted` | 1 | No |
| Onboarding | `build:onboarding` | 1 | No |
| **Active** | `build:active` | **0** | **Yes** |
| Rejected | `build:rejected` | 1 | No |
| Suspended | `build:suspended` | 1 | No |
| Inactive | `build:inactive` | 1 | No |

Only `disabled=0` suppliers are RFQ candidates. A single-select custom field is proposed in
doc 09 **only if** tags+disabled prove insufficient in PHASE 3.

---

## 5. PHASE 1 — what was created (reversible)

Instance: `buildsaudi.k.frappe.cloud` · Company `EFAD FOR MARKETING` · 2026-10-04.

### 5.1 Item Group tree (31 new groups under new root `Building Materials`)
```
Building Materials
├── Plumbing
│   ├── Sanitaryware
│   │   ├── Mixers › Basin Mixers · Kitchen Mixers · Concealed Mixers
│   │   ├── WCs & Bidets
│   │   └── Basins
│   ├── Pipes & Fittings
│   └── Water Heaters
├── Electrical › Wiring & Cables · Switches & Sockets · Lighting · Distribution Boards
├── HVAC › Air Conditioners · Ventilation & Ducting
├── Finishes › Tiles · Paints & Coatings · Gypsum & Ceiling
├── Structural › Cement & Concrete · Steel & Rebar · Blocks & Bricks
├── Doors & Windows
├── Tools & Hardware
└── Safety & PPE
+ "Needs Review"  (under All Item Groups — low-confidence bucket, spec §8)
```
Item Group count: 6 → **37**. Extend as real items arrive (tree is native nested-set, cheap to grow).

### 5.2 Service Items (6, non-stock, sales) — under Item Group `Services`
`BUILD-PROCUREMENT` (Procurement Service), `BUILD-LOGISTICS` (Logistics/Freight),
`BUILD-DELIVERY`, `BUILD-HANDLING`, `BUILD-CROSSDOCK`, `BUILD-STORAGE`.
All `is_stock_item=0`, `is_sales_item=1`. Used for logistics/handling/margin lines on customer Quotation.

### 5.3 Warehouse
`Build 3PL Consolidation - EFAD` (under `All Warehouses - EFAD`) — for cross-dock/consolidation (route B/C).
(Native `Goods In Transit - EFAD`, type=Transit, reused for goods-in-transit.)

### 5.4 Workspace
`Build Procurement` (public) — cards: **Masters** · **Procurement** · **Sales** ·
**Invoicing & Payments**, linking only native DocTypes. Simplifies the daily view per spec §43–44.

### 5.5 Not done in PHASE 1 (deferred by design)
- Payment Terms / Shipping Rules → PHASE 5 (closer to quotation/invoicing).
- Supplier lifecycle tags → applied on first supplier write (PHASE 3).
- Brands / Items (business data) → created on real intake (PHASE 2+).

### 5.6 Rollback
All PHASE 1 objects are deletable while unused: Workspace `Build Procurement`, the 6 `BUILD-*`
Items, warehouse `Build 3PL Consolidation - EFAD`, and the `Building Materials` subtree +
`Needs Review`. No postings, no accounting, no ZATCA, no schema/customization change.

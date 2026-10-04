# 06 — Customer Order → Fulfilment (PHASE 5 + 6)

> Quotation → Sales Order → Purchase Order, then the three native fulfilment routes. All native
> ERPNext — no buildsaudi code. Spec §23–33.

---

## PHASE 5 — Quotation → Sales Order → Purchase Order (verified)

### Flow & mapping
| Step | Native | Build specifics |
|---|---|---|
| Customer Quotation | **Quotation** (`quotation_to=Customer`) | product lines + **Build margin** via native Quotation Item `margin_type`/`margin_rate_or_amount`; logistics/handling via **Service Items** (`BUILD-LOGISTICS` …); taxes via Sales Taxes & Charges |
| Margin | Quotation Item `margin_type=Percentage/Amount` on `price_list_rate` | cost/margin never shown on supplier docs (spec §24) |
| Approval → commitment | **Sales Order** (from Quotation) | — |
| Purchase, split by supplier | one **Purchase Order** per Supplier | SQ→PO or direct PO; service items now `is_purchase_item=1` so freight/3PL POs work |

### Live verification (non-posting, cleaned up)
On `buildsaudi.k.frappe.cloud`:
- **Quotation** with product line `price_list_rate=100` + `margin_type=Percentage, 15%` → computed
  **rate 115**; + `BUILD-LOGISTICS` service line 2000 → `grand_total 7750`. ✅ (native margin works)
- **Sales Order** created, `grand_total 7750`. ✅
- **Purchase Orders split by supplier** — product PO → Supplier A; service PO → Supplier B. ✅
  (Fixed: enabled `is_purchase_item=1` on the 6 `BUILD-*` service items so logistics/storage can be
  purchased from a 3PL/transporter.)
- All documents created then deleted (kept Draft — no submit, **no GL**). Instance left clean.

> Submitting Quotation/Sales Order/Purchase Order posts **no** GL entries, so it is safe in
> production; it was skipped here only because it is a trivial state change not needed to prove the
> native capability. Submit is a normal staff action.

---

## PHASE 6 — Fulfilment routes (native; capabilities confirmed)

All three routes are standard ERPNext and all required doctypes/fields are present on this instance
(verified by schema inspection):

| Route | Native path | Confirmed |
|---|---|---|
| **A. Drop Ship** (supplier → customer direct) | Sales Order Item `delivered_by_supplier` + `supplier` → Purchase Order; **no** Build stock, no fake Purchase Receipt | `delivered_by_supplier` (Check) + `supplier` (Link) present on Sales Order Item ✅ |
| **B. Cross-dock / 3PL** | Purchase Order → **Purchase Receipt** → `Build 3PL Consolidation - EFAD` → **Delivery Note** → customer | Purchase Receipt + Delivery Note present; consolidation warehouse created in PHASE 1 ✅ |
| **C. Multi-supplier consolidation + partial** | multiple Purchase Receipts → consolidation warehouse → one/many **Delivery Notes** (partial supported per row qty) | native partial receipt/delivery ✅ |
| Goods in transit | **Stock Entry** (Material Transfer / Add to Transit) + `Goods In Transit - EFAD` (type=Transit) | present ✅ |
| International landed costs | **Landed Cost Voucher** (+ Incoterm/Named Place on RFQ/Quotation/PO) | Landed Cost Voucher present ✅ |
| Delivery routing | **Delivery Trip** | present ✅ |
| Transporter | **Supplier** with `is_transporter=1` + Delivery Note transporter fields | present ✅ |

### ⚠️ Production stock-posting caveat (important)
This Company has **Perpetual Inventory enabled**, so **submitting** a Purchase Receipt, Delivery Note,
or Stock Entry posts **Stock Ledger + GL entries** (live accounting). Per spec §36/§46 ("no live
accounting entries in production"), the **end-to-end stock test (routes B/C: receipt → consolidation →
partial delivery) must be run in a non-production / preview ERPNext site**, not on
`buildsaudi.k.frappe.cloud`. The capabilities are confirmed present and correctly configured here;
only the posting e2e is deferred to a safe site before cutover.

Route A (Drop Ship) and the whole Quotation→SO→PO chain involve no Build stock posting and are safe
to exercise in production.

### No customizations
PHASES 5 & 6 add **zero** ERPNext customizations and **zero** buildsaudi code — native documents,
configuration, and the PHASE 1 masters (service items, consolidation warehouse) only.

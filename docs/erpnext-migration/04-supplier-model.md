# 04 — Supplier Model

> How suppliers, their lifecycle, and their capabilities map to native ERPNext — no custom
> Vendor/Lead/Onboarding entities (spec §11–13).

---

## 1. One native Supplier for life
- **Supplier** is the only supplier record. No `Vendor` / `Pre Supplier` / `Supplier Lead` /
  `Onboarding Supplier` entities (spec §11).
- `supplier_type = Company` for registered establishments (ERPNext `supplier_type` is
  Company/Individual/Partnership — not the site's local/international, which maps to `country`).
- Contact + Address are the native linked masters (Dynamic Link).

## 2. Lifecycle — Tags + `disabled` (no custom field)
Native Tags (auto-created on first use) + the `disabled` flag + RFQ guards:

| State | Tag | `disabled` | `prevent_rfqs` | RFQ candidate? |
|---|---|---|---|---|
| Pre-Onboarding (website signup) | `build:pre-onboarding` | 1 | 1 | No |
| Contacted | `build:contacted` | 1 | 1 | No |
| Onboarding | `build:onboarding` | 1 | 1 | No |
| **Active** | `build:active` | **0** | **0** | **Yes** |
| Rejected | `build:rejected` | 1 | 1 | No |
| Suspended | `build:suspended` | 1 | 1 | No |
| Inactive | `build:inactive` | 1 | 1 | No |

A new website registration lands as **pre-onboarding** (`disabled=1`, `prevent_rfqs=1`).
Ops promotes to Active (clear `disabled`/`prevent_rfqs`, swap tag). A single-select custom field
is proposed in doc 09 **only if** this proves insufficient (not yet needed).

## 3. Capabilities — Party Specific Item (spec §13)
Supplier capability (which brands / categories they supply) is recorded with native
**Party Specific Item** rows:
```
party_type = Supplier
party      = <Supplier>
restrict_based_on = "Item Group"  → based_on_value = <Item Group>   (one per declared trade category)
restrict_based_on = "Brand"       → based_on_value = <Brand>        (one per declared brand)
```
This both records capability and naturally scopes the supplier to its declared groups/brands in
RFQ/PO — exactly the behaviour spec §14 wants. No Supplier-Brands child table, no matching module.

### 3.1 Website category → Item Group map
| Site category (ar) | Item Group |
|---|---|
| الأدوات الصحية | Sanitaryware |
| الكهرباء والإنارة | Electrical |
| السباكة وأنظمة الأنابيب | Plumbing |
| التكييف والتهوية | HVAC |
| الأرضيات | Tiles |
| الجداريات | Wall Finishes |
| الدهانات الداخلية والخارجية | Paints & Coatings |
| اللواصق والمواد المساعدة | Adhesives & Sealants |

(`Wall Finishes` and `Adhesives & Sealants` added under `Finishes` in PHASE 3 to cover the site's
8 categories exactly — additive, reversible.)

Declared brands → native **Brand** master (created if missing; these are supplier-asserted so
confidence is acceptable, unlike free-text customer-request brands).

## 4. Transporter / carrier (spec §30)
A carrier is a **Supplier** with `is_transporter = 1` (+ Delivery Note transporter fields). No
custom transporter master. The legacy `/api/carriers/*` onboarding (Odoo-coupled) folds into this
model in a later step.

---

## 5. PHASE 3 — `/register` → ERPNext (DONE, core)

### 5.1 What changed
- **New:** `lib/erpnext-vendor-registration.ts` (`registerVendorInErpnext`), `lib/erpnext-vendor-registration.test.ts` (5 tests).
- **Edited:** `app/api/vendors/register/route.ts` — ERPNext branch behind `isErpnextConfigured()`, else legacy Odoo.
- **Masters:** added Item Groups `Wall Finishes`, `Adhesives & Sealants`.
- Form/UX, Turnstile, zod validation, rate limiting, idempotency preserved (spec §37).

### 5.2 Flow
```
idempotency (fingerprint = name+country+email, claimSubmission)
 → validate 8 categories
 → dedup: Contact by email/phone → linked Supplier; else Supplier by supplier_name
 → resolve Country by ISO code
 → create Supplier (Company, supplier_group, country, SAR if local, disabled=1, prevent_rfqs=1, supplier_details)
 → tag build:pre-onboarding
 → create primary Contact (linked) + set supplier_primary_contact
 → Party Specific Item per category (Item Group) + per brand (Brand, created if missing)
```

### 5.3 Scope boundary (documented follow-up)
`/register` core is ported. The **multi-step onboarding/files sub-flow**
(`/api/vendors/registration-files|documents|onboarding|complete`, `lib/vendor-onboarding-guard.ts`)
remains Odoo-coupled — it is keyed on a **numeric** partner id (`createVendorFilesToken(vendorId: number)`)
and the Odoo `ir.attachment` model. In ERPNext mode the register returns `{ok, status}` **without**
an `uploadToken`; declared file names are recorded in `supplier_details`. Porting this sub-flow
(ERPNext `File` + `uploadFileToDoc`, string docnames) is the remaining part of PHASE 3's full cutover.
The feature flag keeps production on Odoo until then.

### 5.4 Verification
- `tsc` clean · 5/5 unit tests pass (Supplier+Contact+capabilities, idempotency, contact-dedup,
  invalid-category guard, international/no-SAR).
- **Live** against `buildsaudi.k.frappe.cloud`: Supplier (Company/Distributor/Saudi Arabia/SAR/
  disabled=1/prevent_rfqs=1) + primary Contact + 4 Party Specific Items (2 Item Groups + 2 Brands)
  + tag `build:pre-onboarding`. Cleaned up afterwards (instance clean).
- **Zero ERPNext customizations** added.

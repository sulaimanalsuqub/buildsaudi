# 11 — ERPNext Objects Inventory (reproducible)

> Everything created on `buildsaudi.k.frappe.cloud` during the migration, so the instance can be
> rebuilt if lost. No custom app was used (per spec), so these live in the site DB — this doc +
> `assets/` is their version-controlled record. All via the ERPNext API; all additive/removable.

## Masters (PHASE 1 + 3)
- **Item Group tree** under `Building Materials` (39 total incl. defaults): Plumbing › Sanitaryware ›
  Mixers (Basin/Kitchen/Concealed), WCs & Bidets, Basins; Pipes & Fittings; Water Heaters · Electrical ›
  Wiring & Cables, Switches & Sockets, Lighting, Distribution Boards · HVAC › Air Conditioners,
  Ventilation & Ducting · Finishes › Tiles, Paints & Coatings, Gypsum & Ceiling, **Wall Finishes**,
  **Adhesives & Sealants** · Structural › Cement & Concrete, Steel & Rebar, Blocks & Bricks ·
  Doors & Windows · Tools & Hardware · Safety & PPE · `Needs Review` (under All Item Groups).
- **Service Items** (non-stock, `is_sales_item=1` + `is_purchase_item=1`, group `Services`):
  `BUILD-PROCUREMENT, BUILD-LOGISTICS, BUILD-DELIVERY, BUILD-HANDLING, BUILD-CROSSDOCK, BUILD-STORAGE`.
- **Warehouse**: `Build 3PL Consolidation - EFAD` (under `All Warehouses - EFAD`).
- **Workspace**: `Build Procurement` (public) — cards: Masters / Procurement / Sales / Invoicing & Payments.

## Supplier category → Item Group map (website `/register`)
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

Synced live: supplier registration writes each selected category as a **Party Specific Item**
(`party_type=Supplier, restrict_based_on="Item Group"`), and each declared brand as
(`restrict_based_on="Brand"`). (Source of the map: `lib/erpnext-vendor-registration.ts`.)

## B2G custom objects (PHASE 8)
- **Custom Fields on Quotation** (one collapsible section, shown when `custom_business_channel=="Government"`):
  `custom_business_channel` (Select: Commercial/Government/Retail, default Commercial),
  `custom_government_tender_information` (Section Break),
  `custom_tender_name`, `custom_tender_number`, `custom_etimad_reference`, `custom_execution_period` (Data),
  `custom_scope_of_supply` (Select: Supply Only / Supply + Delivery / Supply + Installation / Supply + Delivery + Installation).
- **Print Format**: `Build | Government Project Quotation` (Jinja, Arabic RTL, standard=No) —
  source of truth saved at `assets/build-government-project-quotation.print.html`.
- **Terms & Conditions**: `Build | Government Tender Terms` (conservative gov wording; selling=1).
- **Opportunity Type**: `Government Tender`.

## Company / legal identity
- Company `EFAD FOR MARKETING` (legal entity; Build is the operating brand).
- **Commercial Registration** stored in `Company.registration_details = "CR / السجل التجاري: 1131333714"`
  (shown in the B2G print format bidder block).
- VAT (`tax_id`): empty — set when VAT-registered (PHASE 7 / ZATCA). Until then gov quotations carry VAT = 0.

## Integration / access
- **API user** `integration@build.sa` (System User), roles: **Sales Manager, Purchase Manager,
  Stock Manager, Projects Manager, Item Manager** (operational; NO Accounts/ZATCA/System Manager —
  verified: GL Entry read → 403). API key/secret live only in Vercel env (`ERPNEXT_API_KEY/SECRET`).
- The original System-Manager key (exposed in chat) was **revoked**.

## Not created (gated)
- VAT accounts / Tax Category / Taxes & Charges templates / Item Tax Template — need CoA leaf VAT
  accounts (gated, PHASE 7).
- ZATCA Business Settings (onboarding) — gated.

## Rebuild
Re-run the migration API calls (documented across docs 02/04/05/10) with an admin key, then
import the print format HTML from `assets/`. The `lib/erpnext*.ts` client + domain functions
create the business records at runtime.

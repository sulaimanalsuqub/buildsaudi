# Build System SOP

Build is not a marketplace or public platform.
Build is a procurement partner: it sources materials on behalf of clients,
manages supplier relationships, and handles the procurement cycle directly.

Always align with what is actually implemented in the codebase and ERPNext.
Do not assume routes, fields, workflows, warehouse setup, catalog setup, or integrations.
When uncertain about ERPNext state, query ERPNext first, then act.

## Tech Stack

- Frontend: Next.js App Router
- Backend / ERP: ERPNext on Frappe Framework
- API: ERPNext REST API / Frappe client patterns
- Database: MariaDB through ERPNext only

## Actual Website Routes

- Arabic customer request: `/ar/get-quote`
- Arabic supplier registration: `/ar/register`
- English customer request: `/get-quote`
- English supplier registration: `/register`

Do not use `/request` or `/become-supplier`.

## Core Rules

1. Use the `build_` prefix for Build custom fields. Do not introduce `custom_` fields.
2. Use ERPNext REST API for ERPNext data operations. Do not query ERPNext database directly.
3. Do not modify ERPNext core DocTypes directly. Use Custom Fields and standard Frappe customization.
4. Workflow state fields are `build_request_stage` and `build_supplier_stage`.
5. BOQ files are currently stored as URL text in `build_boq_file_url`, not as Frappe Attach records.
6. Arabic-first UI is required. Customer-facing UI must support RTL.
7. Do not use a virtual warehouse named `Build` in stock logic until it is confirmed configured in ERPNext.
8. Do not implement WhatsApp integration unless explicitly instructed.
9. Do not invent product catalog, supplier matching, warehouse, or portal behavior. Confirm first.

## Current ERPNext Custom Fields

### Opportunity

- `build_request_section`: Section Break
- `build_request_source`: Select
- `build_request_stage`: Select, workflow stage
- `build_project_name`: Data
- `build_contact_phone`: Data
- `build_contact_email`: Data
- `build_delivery_address`: Small Text
- `build_delivery_date`: Date
- `build_required_materials`: Long Text
- `build_sheet_link`: Data
- `build_boq_file_url`: Data, URL only
- `build_customer_notes`: Long Text

### Supplier

- `build_onboarding_section`: Section Break
- `build_supplier_stage`: Select, workflow stage
- `build_website_source`: Check
- `build_contact_section`: Section Break
- `build_manager_name`: Data
- `build_contact_number`: Data
- `build_email`: Data
- `build_cr_number`: Data
- `build_vendor_type`: Data / Select-style value from website
- `build_product_categories`: Text / comma-separated website values
- `build_represented_brands`: Text / Data
- `build_coverage_regions`: Text / comma-separated website values
- `build_has_warehouse`: Check
- `build_offers_credit`: Check
- `build_payment_terms`: Text / comma-separated website values
- `build_credit_limit`: Currency / numeric value
- `build_gov_projects`: Check

## Workflow 1: Customer Product Request

Website route: `/ar/get-quote`

On submit:

1. Create `Lead`.
2. Create `Opportunity`.
3. Set `opportunity_type` to `Build Product Request`.
4. Set `build_request_source` to `Build Website`.
5. Set `build_request_stage` to `New Product Request`.

Workflow field: `build_request_stage`.
Do not use `sales_stage` as the Build workflow field.

Stages and transitions:

```text
New Product Request
  -> [Start Review] -> Reviewing Request
  -> [Source Suppliers] -> Sourcing Suppliers
  -> [Send Quote] -> Quoted to Customer
  -> [Mark Fulfilled] -> Fulfilled

New Product Request -> [Cancel] -> Cancelled
Reviewing Request -> [Cancel] -> Cancelled
Sourcing Suppliers -> [Cancel] -> Cancelled
Quoted to Customer -> [Cancel] -> Cancelled
Cancelled -> [Reopen] -> Reviewing Request
```

## Workflow 2: Supplier Registration

Website route: `/ar/register`

On submit:

1. Create `Supplier`.
2. Set `supplier_group` to `Build Pre-Registered Suppliers`.
3. Set `build_supplier_stage` to `Pre Registration`.
4. Set `build_website_source` to checked.

Workflow field: `build_supplier_stage`.

Stages and transitions:

```text
Pre Registration
  -> [Review] -> Under Review
  -> [Approve] -> Approved
  -> [Reject] -> Rejected

Rejected -> [Review] -> Under Review
```

## Current State

Done:

- Customer request form: `/ar/get-quote`
- Supplier registration form: `/ar/register`
- ERPNext Lead and Opportunity creation for product requests
- ERPNext Supplier creation for supplier registrations
- Build custom fields with `build_` prefix
- Product request workflow on Opportunity
- Supplier onboarding workflow on Supplier
- Initial Item Group structure in ERPNext

Started:

- ERPNext catalog structure through Item Groups

Not implemented yet:

- Full ERPNext product catalog as `Item` records
- Supplier to Item linking
- Automated supplier matching
- Virtual warehouse `Build`
- ERPNext Email Account / RFQ reply automation
- WhatsApp integration
- Supplier portal
- BOQ as Frappe Attach

## Catalog and Matching

Build currently maintains only an initial category structure in ERPNext.
Actual catalog Items and supplier-item relationships are not complete.

Supplier matching is currently a manual Build team operation. Do not automate matching
unless explicitly instructed.

## RFQ and Quoting Direction

The intended operations flow is:

1. Build reviews a customer Opportunity.
2. Build identifies suitable suppliers manually from the catalog and supplier knowledge.
3. Build sends RFQs through ERPNext email or manual communication.
4. Suppliers respond with prices.
5. Build records Supplier Quotations in ERPNext.
6. Build compares supplier responses.
7. Build adds service fee or margin.
8. Build sends final Quotation to the customer.
9. After customer approval, Build creates Sales Order and Purchase Order.

Do not implement this full flow until instructed. Treat it as planned operating direction.

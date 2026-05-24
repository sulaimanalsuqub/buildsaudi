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
5. Quantity files from `/ar/get-quote` are uploaded to ERPNext File, attached to the Opportunity, and referenced in `build_boq_file_url`.
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
- `build_boq_file_url`: Data, ERPNext File URL reference
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
- `build_review_section`: Section Break
- `build_verification_status`: Select, `Pending`, `Verified`, `Needs More Information`, `Failed`
- `build_preferred_for_rfq`: Check
- `build_rfq_priority`: Select, `Standard`, `Preferred`, `Do Not Use`
- `build_review_date`: Date
- `build_reviewed_by`: Data
- `build_review_notes`: Long Text
- `build_rejection_reason`: Long Text

### Request for Quotation

- `build_request_section`: Section Break
- `build_opportunity`: Link to Opportunity
- `build_project_name`: Data
- `build_customer_name`: Data
- `build_contact_phone`: Data
- `build_delivery_address`: Small Text
- `build_delivery_date`: Date
- `build_required_materials`: Long Text
- `build_boq_file_url`: Data, URL reference
- `build_internal_notes`: Long Text

### Supplier Quotation

- `build_request_section`: Section Break
- `build_opportunity`: Link to Opportunity
- `build_rfq`: Link to Request for Quotation
- `build_supplier_response_notes`: Long Text
- `build_delivery_lead_time`: Data

### Quotation

- `build_request_section`: Section Break
- `build_opportunity`: Link to Opportunity
- `build_supplier_quotation`: Link to Supplier Quotation
- `build_costing_section`: Section Break
- `build_supplier_cost`: Currency
- `build_service_fee_type`: Select, `Percentage` or `Fixed Amount`
- `build_service_fee_percent`: Percent
- `build_service_fee_amount`: Currency
- `build_final_notes`: Long Text

### Sales Order

- `build_order_section`: Section Break
- `build_opportunity`: Link to Opportunity
- `build_customer_quotation`: Link to Quotation
- `build_supplier_quotation`: Link to Supplier Quotation
- `build_fulfillment_method`: Select, `Drop Ship`, `Build Warehouse`, `To Be Decided`
- `build_delivery_status`: Select, `Pending`, `PO Created`, `In Fulfillment`, `Delivered`, `Closed`, `Cancelled`
- `build_customer_approval_date`: Date
- `build_purchase_order`: Link to Purchase Order

### Purchase Order

- `build_order_section`: Section Break
- `build_opportunity`: Link to Opportunity
- `build_sales_order`: Link to Sales Order
- `build_customer_quotation`: Link to Quotation
- `build_supplier_quotation`: Link to Supplier Quotation
- `build_fulfillment_method`: Select, `Drop Ship`, `Build Warehouse`, `To Be Decided`
- `build_supplier_delivery_status`: Select, `Pending`, `Confirmed`, `In Progress`, `Shipped`, `Delivered`, `Cancelled`
- `build_delivery_notes`: Long Text

### Item

- `build_catalog_section`: Section Break
- `build_catalog_status`: Select, `Draft`, `Active`, `Inactive`, `Discontinued`
- `build_product_category`: Select matching website supplier categories
- `build_primary_supplier`: Link to Supplier
- `build_brand`: Data
- `build_origin_country`: Data
- `build_keywords`: Small Text
- `build_catalog_notes`: Long Text

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
- ERPNext File upload and Opportunity attachment for quantity files
- ERPNext Supplier creation for supplier registrations
- Build custom fields with `build_` prefix
- Product request workflow on Opportunity
- Supplier onboarding workflow on Supplier
- Supplier review fields for verification, RFQ priority, and rejection notes
- Supplier Groups: `Build Pre-Registered Suppliers`, `Build Approved Suppliers`, `Build Rejected Suppliers`
- Initial Item Group structure in ERPNext
- Build RFQ fields on Request for Quotation
- ERPNext Client Script on Opportunity: `Build Opportunity RFQ Button`
- Build supplier response fields on Supplier Quotation
- Build costing and service fee fields on Quotation
- Build fulfillment fields on Sales Order and Purchase Order
- Build catalog fields on Item
- Operational placeholder Item: `BUILD-MATERIALS-REQUEST`
- Email Templates: `Build RFQ Supplier Request`, `Build Customer Quotation`
- Email Account: `Build Resend` for ERPNext outgoing SMTP through Resend

Started:

- ERPNext catalog structure through Item Groups
- Manual RFQ and quote flow using ERPNext standard documents
- Catalog import template: `docs/build-catalog-import-template.csv`

Not implemented yet:

- Full ERPNext product catalog as `Item` records
- Supplier to Item linking
- Automated supplier matching
- Virtual warehouse `Build`
- RFQ reply automation
- WhatsApp integration
- Supplier portal

## Catalog and Matching

Build currently maintains an initial category structure in ERPNext and one operational
placeholder Item named `BUILD-MATERIALS-REQUEST`.

Use `BUILD-MATERIALS-REQUEST` for RFQs and quotes when the customer request is still
free-text and not mapped to detailed catalog Items.

Actual catalog Items and supplier-item relationships are not complete.

Supplier matching is currently a manual Build team operation. Do not automate matching
unless explicitly instructed.

## RFQ and Quoting Direction

The intended operations flow is:

1. Build reviews a customer Opportunity.
2. Build identifies suitable suppliers manually from the catalog and supplier knowledge.
3. From the Opportunity form, use the Build button `إنشاء RFQ لبيلد` to create a linked RFQ draft.
4. Build adds selected suppliers on the RFQ and sends it through ERPNext email or manual communication.
5. Suppliers respond with prices.
6. Build records Supplier Quotations in ERPNext.
7. Build compares supplier responses.
8. Build adds service fee or margin.
9. Build sends final Quotation to the customer.
10. After customer approval, Build creates Sales Order.
11. Build creates Purchase Order for the selected supplier.
12. Build links Sales Order and Purchase Order through `build_purchase_order` and `build_sales_order`.

The first manual version of this flow is now configured with ERPNext standard
documents and Build linking fields. Do not automate supplier matching, WhatsApp,
or portal behavior until instructed.

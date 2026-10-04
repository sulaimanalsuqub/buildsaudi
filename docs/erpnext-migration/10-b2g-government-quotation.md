# 10 — B2G Government Project Quotation

> A limited, safe, upgrade-safe addition **inside the standard Quotation** for government
> tenders (B2G). Standard ERPNext first → Configuration → Print Format → Custom Field only when
> necessary. No new DocType/Module, no core edit, no parallel workflow. Removable without
> affecting any other Build process.

Legal note: **EFAD FOR MARKETING** is the legal entity on all documents; **Build** is the
operating brand shown on customer-facing surfaces.

---

## A. Standard, reused as-is
Quotation itself + its native fields: `name` (= Quotation Number), `transaction_date` (= Date),
`valid_till` (= **Bid Validity**), `customer_name`/`party_name` (= **Government Entity**),
`shipping_address` (= **Delivery Location**), item table (BOQ), `total`/`discount_amount`/`net_total`/
`total_taxes_and_charges`/`grand_total`, `in_words`/`base_in_words` (**Amount in Words**, native),
`tc_name`/`terms` (**Terms**). Flow: **Opportunity → Quotation → Sales Order → PO → … → Sales Invoice**
all native (the gov quotation converts to Sales Order through the normal path).

## B. Print Format only
The entire official layout → **`Build | Government Project Quotation`** (Arabic RTL, Jinja, custom,
`standard=No`), completely separate from the B2B/standard formats.

## C. Configuration
- **Terms & Conditions** master `Build | Government Tender Terms` (conservative wording; no B2B terms).
- **Opportunity Type** `Government Tender` (standard classification for the Opportunity step).
- No naming-series change (kept simple/stable per §15).

## D. Data with no standard equivalent → minimal Custom Fields
Tender/Project Name, Tender Number, Etimad Reference, Delivery/Execution Period, Scope of Supply.

## E. The minimal custom fields (all on Quotation, one B2G-only section)
| Field | Type | Notes |
|---|---|---|
| `custom_business_channel` | Select: Commercial / Government / Retail (default Commercial) | the single classifier; drives the section + which print format staff pick |
| `custom_government_tender_information` | Section Break (collapsible, `depends_on` channel==Government) | hides everything below for non-gov |
| `custom_tender_name` | Data | اسم المنافسة / المشروع |
| `custom_tender_number` | Data | رقم المنافسة |
| `custom_etimad_reference` | Data (optional) | الرقم المرجعي (اعتماد) |
| `custom_execution_period` | Data | مدة التنفيذ |
| `custom_scope_of_supply` | Select (Supply / +Delivery / +Installation / +Delivery+Installation) | نطاق التوريد |

## F. Decided NOT to customize (and why)
- **Government Entity** → the Customer (`party_name`), no field (no duplicate data).
- **Delivery Location** → native shipping address, no field.
- **Bid Validity / Quotation No. / Date** → native `valid_till` / `name` / `transaction_date`.
- **Amount in Words** → native `in_words` (no custom number-to-words function, §8).
- **Guarantees** (initial/final) → shown in Terms/Notes only; no guarantees system (§12).
- **Scope** uses a Select, not a Workflow (§10).
- No Government Tender/BOQ/Customer/Invoice DocType or parallel workflow (§13).

---

## Print format contents (`Build | Government Project Quotation`)
1. **Cover** — Build wordmark + legal entity line; "العرض المالي / FINANCIAL PROPOSAL"; tender grid
   (name, entity, number, Etimad, quotation no., date, bid validity, execution period, scope);
   **bidder legal block** (legal company name, VAT, address/phone/email from the company address, Brand: Build).
2. **Cover letter** — formal Arabic letter referencing tender/Etimad + a mini financial summary
   (net, discount, VAT, total incl. VAT).
3. **BOQ** — `م | رقم الصنف/البند | الوصف | الوحدة | الكمية | سعر الوحدة | الإجمالي`, long descriptions
   preserved (no truncation), item order preserved, header repeats across pages.
4. **Financial summary** — total, discount, net before VAT, VAT 15%, **Grand Total incl. VAT** (prominent),
   + **amount in words** (native `in_words`).
5. **Terms** — `doc.terms`, falling back to the linked `tc_name` (`Build | Government Tender Terms`).
   Never pulls B2B commercial terms.

## Verification (live on `buildsaudi.k.frappe.cloud`, all cleaned up)
- Government Quotation, 10 BOQ lines, 15% VAT, 5% discount → total 1,725,000 · net 1,638,750 ·
  VAT 245,812.5 · **grand 1,884,562.5** (> 1M, §13). ✅
- **PDF rendered** via native `download_pdf` with the gov format → valid multi-page `application/pdf`
  (~55 KB), long description intact, RTL/Arabic. ✅ (§4,5,6,7,8,11-print, 12-multipage)
- Variant **without Etimad** → renders fine (§14). ✅
- **Terms** fallback from `tc_name` prints gov terms; no B2B terms appear (§9). ✅
- Converted Quotation → **Sales Order** (standard chain) (§9-convert). ✅
- **B2B unaffected**: a Commercial quotation keeps the gov section hidden (channel defaults Commercial);
  the **standard** print format still renders (§15). ✅
- Amount in words: native `in_words` renders (English under the API user's locale). **To print Arabic
  words**, set the computing context language to Arabic (native behaviour; e.g. Customer/Quotation
  `language = ar`, or the ksa_compliance Arabic words used on ZATCA invoices). No custom function added (§8).

## Customizations added
7 Custom Fields (C1–C7) + 1 Print Format (C8) + Terms (C9) + Opportunity Type (C10) — see doc 09.
All upgrade-safe and removable; isolated to the government-quotation path.

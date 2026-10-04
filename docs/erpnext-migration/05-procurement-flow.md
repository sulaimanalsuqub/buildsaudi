# 05 — Procurement Flow (Material Request → RFQ → Supplier Quotation)

> Native RFQ and Supplier Quotation on ERPNext, with no supplier portal; email via Resend with
> a signed correlation token. Replies become **Draft** Supplier Quotations (spec §15–22).

---

## 1. Flow

```
Material Request (Purpose=Purchase)        ← PHASE 2 (customer supply request)
   │  staff: recommend eligible suppliers (Active = disabled 0; capabilities via Party Specific Item)
   ▼
Request for Quotation (native)             ← staff action in ERPNext; split by trade/category as needed
   │  outbound email: buildsaudi + Resend (NO portal). Subject carries [RFQID:<token>] + [RFQ-name]
   ▼
supplier replies by email  →  Resend inbound webhook  →  /api/rfq/inbound-email
   │  correlation token → (RFQ, Supplier); extract reply (DeepSeek); guards
   ▼
Supplier Quotation (DRAFT, never auto-submitted)   ← linked to RFQ + RFQ item rows
   │  staff reviews → Submit
   ▼
Supplier Quotation Comparison (native report)  → pick Item→Supplier per line, no auto-award (spec §21)
```

## 2. Correlation token (no portal — spec §17/§18)
`[RFQID:<token>]` in the email subject, where
`token = base64url("<rfqName>|<supplier>|<hmac_sha256>")` — URL-safe, ≥32 chars, matching the
inbound regex. Signed with `RFQ_CORRELATION_SECRET` (falls back to `ERPNEXT_API_SECRET`). The token
is the **authoritative** reply↔(RFQ,Supplier) link — sender email alone is never trusted (spec §18).
Helpers: `buildRfqCorrelation(rfq, supplier)`, `resolveRfqCorrelation(token)`, `rfqEmailSubject(...)`.

## 3. Inbound reply → Draft Supplier Quotation
`lib/erpnext-rfq.ts` → `processQuoteReplyErpnext()` (used by `/api/rfq/inbound-email` when
`isErpnextConfigured()`), preserving idempotency / Svix signature / replay protection:
- resolve correlation → verify RFQ exists and supplier is on the RFQ (else `request_not_found` / `partner_not_matched`)
- `attachmentOnly` → add a review **Comment** on the RFQ → `attachment_review_required` (no guess)
- extraction fails / low confidence → review Comment → `extraction_failed`
- else `createDraftSupplierQuotationFromReply`: Draft Supplier Quotation, SAR, `valid_till` from
  stated validity, items copied from the RFQ with rates matched per line (free-text name match;
  single-line total → unit rate; unknown → 0 for staff to fill), each item linked back to the RFQ
  (`request_for_quotation` + `request_for_quotation_item`). Raw reply + extraction summary stored as a Comment.

## 4. Comparison (spec §21)
Use the **native Supplier Quotation Comparison** report (`Analytics → Supplier Quotation Comparison`).
No custom comparison engine. Supports item-by-item selection; the buyer awards per line (no auto-award).

## 5. PHASE 4 — status

### Done + live-verified
- `lib/erpnext-rfq.ts` (correlation, Draft SQ builder, inbound processor) + `lib/erpnext-rfq.test.ts` (6 tests).
- `app/api/rfq/inbound-email/route.ts` wired behind the flag; in ERPNext mode the correlation token is
  self-sufficient so the legacy `BLD-` tracking number is not required (Odoo mode unchanged).
- `lib/quote-intake.ts` `QuoteIntakeResult.quoteId` widened to `number | string` (ERPNext SQ names).
- **Live** against `buildsaudi.k.frappe.cloud`: created a real RFQ (Draft) + supplier + 2 items;
  correlation round-tripped; generated a **Draft** Supplier Quotation (SAR, valid_till=+30d, item rates
  120/15, linked to RFQ item rows, review Comment). All cleaned up.
- **Zero ERPNext customizations** added.

### Remaining (documented follow-up)
- **Outbound RFQ send**: creating the native RFQ + emailing suppliers via Resend is a **staff action
  in ERPNext** today; buildsaudi exposes `rfqEmailSubject()`/`buildRfqCorrelation()` for the token. A
  dedicated outbound trigger (ERPNext RFQ → Resend with RFQ PDF) can be added as a thin route/webhook
  when outbound is moved off the current channel. Not required for inbound→Draft-SQ to work.
- Recommended-suppliers helper (spec §14 ranking) — only if native Party Specific Item + filters prove
  insufficient; not built (no evidence it's needed yet).
- Set `RFQ_CORRELATION_SECRET` in env for an independent signing secret (optional; defaults to ERPNext secret).

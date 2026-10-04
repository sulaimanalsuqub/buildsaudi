# 08 — Cutover & Rollback

> How each website seam flips to ERPNext safely, and how to roll back. The whole migration is
> gated behind one feature switch per environment.

## The switch
`isErpnextConfigured()` = true when `ERPNEXT_BASE_URL` + `ERPNEXT_API_KEY` + `ERPNEXT_API_SECRET`
are all set. When true, the three website seams write to ERPNext; when unset, they fall back to the
legacy path (Build-OPT for `/get-quote`, Odoo for `/register` and RFQ inbound). **Unsetting
`ERPNEXT_BASE_URL` in an environment is the instant rollback.**

| Seam | ERPNext on | ERPNext off (rollback) |
|---|---|---|
| `/api/quotes/register` | Material Request | Build-OPT `/api/public/procurement-requests` |
| `/api/vendors/register` | Supplier + Contact + Party Specific Item | Odoo `res.partner` |
| `/api/rfq/inbound-email` | Draft Supplier Quotation | Odoo quote intake |

## Required env (production)
```
ERPNEXT_BASE_URL=https://buildsaudi.k.frappe.cloud
ERPNEXT_API_KEY=<least-privilege api user>
ERPNEXT_API_SECRET=<secret>
ERPNEXT_COMPANY=EFAD FOR MARKETING          # optional (default)
RFQ_CORRELATION_SECRET=<independent secret>  # optional (defaults to ERPNEXT_API_SECRET)
```

## Gates before flipping production (in order)
1. **GAP-08 — least-privilege API user.** Replace the System-Manager key used in dev with a dedicated
   ERPNext API User holding only Purchase/Sales/Stock/Buying/Selling roles; **rotate** the key pasted
   in chat. Set the three env vars in Vercel (never commit).
2. **Preview parity.** Point a Vercel **preview** env at ERPNext; submit a real `/get-quote` and
   `/register` from the preview site; confirm Customer/Project/Material Request and Supplier/Contact/
   Party Specific Item appear correctly.
3. **Stock e2e on a non-production/test ERPNext site** (perpetual inventory posts GL — see doc 06):
   run routes B/C (Purchase Receipt → consolidation → partial Delivery Note) there, not on production.
4. **Flip production** by setting `ERPNEXT_*`; watch the first real submissions; keep Odoo/Build-OPT
   envs in place for one rollback window.
5. **Vendor onboarding/files sub-flow** (`/vendors/registration-files|documents|onboarding|complete`)
   remains on Odoo until its ERPNext port lands (doc 04 §5.3); the register core already runs on ERPNext.
6. **Outbound RFQ send** (ERPNext RFQ → Resend with token) wired when outbound moves off its current
   channel (doc 05 §5); inbound→Draft-SQ already runs on ERPNext.

## Closing items done (2026-10-04)
- **API user**: least-privilege `integration@build.sa` (Sales User, Purchase User, Stock User, Item Manager — no Accounts/ZATCA/System Manager). **Generate its API key/secret in the ERPNext UI** (User → API Access → Generate Keys) and set in Vercel as `ERPNEXT_API_KEY` / `ERPNEXT_API_SECRET` (never commit). The old System-Manager key used during dev is rotated/revoked.
- **Supplier files**: `/api/vendors/registration-files` → native Frappe **File** attached to the Supplier (ERPNext mode) — no Odoo, no custom doctype. Live-verified (private attachment, idempotent).
- **RFQ outbound**: `POST /api/rfq/send` (service-secret `RFQ_SEND_SECRET` or `PUBLIC_INTAKE_SERVICE_SECRET`, `{rfqName, dryRun}`) emails each RFQ supplier via Resend with the `[RFQID:<token>]` subject; no portal. Inbound replies still create **Draft** Supplier Quotations only.
- **Register-form Odoo decoupling**: product categories are now **static constants** (no Odoo call) — this removes the "التسجيل متوقف مؤقتًا للصيانة" fallback that appeared whenever Odoo was unreachable; `vendor-commercial-options` degrades gracefully (empty lists) instead of 503.

## Remaining Odoo/Build-OPT runtime dependencies (NOT deleted — still the rollback fallback)
Do not delete until production parity + the rollback window close (spec §38). Current map:
- `lib/odoo.ts` imported by ~17 files (carrier flows, vendor onboarding/complete, `quote-intake`, `cron/odoo-outbox`, `email` record links).
- `vendorOdooCall` in 3 files; `BUILD_OPT_*` in 2 (`quotes/register` + `carriers/register` fallbacks).
- The ERPNext feature flag keeps these as the live path until `ERPNEXT_*` is set per environment. Once production runs on ERPNext and parity holds, remove in a dedicated cleanup PR (Odoo client, Build-OPT fetch, `x_build_*`, odoo-outbox cron) — replacement is verified first.

## After production parity is proven
- Remove Odoo/Build-OPT runtime dependencies and dead code (spec §38) — a final, separate cleanup PR.
- Run the gated **ZATCA/accounting** phase (doc 07) with approval.

## Shared working tree note
The repo on disk is shared with another session; migration code lives on `main` as additive files
(`lib/erpnext*.ts`) + minimal route edits, **uncommitted**. Create a dedicated branch / commit only
when the other session's WIP is reconciled.

# Build Saudi — Production Go-Live Checklist

Use this checklist for a controlled launch or redeployment. Do not mark a control complete merely because the website loads: the Odoo, Redis, email, and inbound-RFQ paths must all be proven in the target environment.

## 1. Release gate

- [ ] A named release owner has approved the deployment scope and rollback owner.
- [ ] `npm audit --omit=dev --audit-level=high` reports no high/critical production vulnerabilities.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` have passed on the release commit.
- [ ] No unreviewed local changes are included.
- [ ] A Vercel Preview has been checked before Production.

## 2. Required production configuration

Configure these as server-only secrets unless explicitly prefixed `NEXT_PUBLIC_`:

```bash
NEXT_PUBLIC_APP_URL=https://www.build.sa
NEXT_PUBLIC_SITE_URL=https://www.build.sa

ODOO_BASE_URL=https://YOUR_COMPANY.odoo.com
ODOO_DATABASE=...
ODOO_USERNAME=SERVICE_ACCOUNT_EMAIL
ODOO_API_KEY=...

UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

RESEND_API_KEY=...
RESEND_INBOUND_WEBHOOK_SECRET=whsec_...
CRON_SECRET=LONG_RANDOM_VALUE
OTP_SECRET=LONG_RANDOM_VALUE
VENDOR_ONBOARDING_TOKEN_SECRET=LONG_RANDOM_VALUE
UPLOAD_TOKEN_SECRET=LONG_RANDOM_VALUE
TURNSTILE_SECRET_KEY=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
DEEPSEEK_API_KEY=...
```

- [ ] Every secret is distinct, long, and stored only in Vercel/Odoo/Resend/Upstash secret managers.
- [ ] No `NEXT_PUBLIC_` variable contains Odoo, Redis, Resend, DeepSeek, cron, or token secrets.
- [ ] `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present. Public submissions must fail closed without them in Production.
- [ ] Legacy ERPNext/Supabase variables are removed or documented as unused to avoid routing/configuration ambiguity.
- [ ] A redeploy was triggered after configuration changes.

## 3. Odoo readiness and access control

- [ ] The production service account can access only the required Build models and cannot administer unrelated Odoo data.
- [ ] Human operations, approver, and read-only roles have been tested with non-admin accounts.
- [ ] The required custom models and fields exist, including request submission keys, RFQ correlations, quote inclusion states, FX snapshot fields, outbox idempotency keys, supplier/carrier profiles, and onboarding documents.
- [ ] The required Odoo approval categories and server actions are present and usable.
- [ ] Odoo backup/restore and audit-log retention have an accountable owner.
- [ ] Run `scripts/reconcile-launch-workflows.mjs` against staging in report mode; resolve any mismatches before Production.

## 4. Customer request and supplier/carrier onboarding

- [ ] Submit the same customer request twice with the same browser submission ID; exactly one procurement request is created and the second response is a replay.
- [ ] Simulate a timeout after submission and confirm operations can reconcile the request without duplicate lines or attachments.
- [ ] Submit the same supplier registration twice; exactly one preliminary profile/outbox event exists.
- [ ] Submit the same carrier registration twice; exactly one preliminary profile/outbox event exists.
- [ ] A local and an international supplier complete onboarding using real test documents.
- [ ] A carrier completes onboarding using real test documents.
- [ ] Suspended, rejected, and expired-document profiles are excluded from matching.

## 5. RFQ, pricing, and operational completion

- [ ] Operations approves a supplier RFQ and the email contains both the request tracking number and unique `RFQID` correlation.
- [ ] A supplier replies through the configured inbound domain; the reply creates exactly one quote and is linked to the correct sent RFQ.
- [ ] An attachment-only reply creates an operations alert and is manually recovered under a documented procedure.
- [ ] At least two supplier quotes and, if needed, freight quotes are compared and a human approval selects the winner.
- [ ] Unknown tax/delivery inclusion, unavailable FX, or stale/ambiguous quote data blocks automatic customer pricing.
- [ ] The final customer offer records net material cost, freight, input VAT, output VAT, gross total, markup, and FX snapshot.
- [ ] Before taking payment, the business has a documented binding order, cancellation/refund, invoice, payment, delivery, proof-of-delivery, and reconciliation workflow.

## 6. Resend and cron proof

- [ ] Sending domain has SPF, DKIM, DMARC, and a monitored sender address.
- [ ] Inbound RFQ domain has the required MX records and Resend webhook subscribed to `email.received`.
- [ ] A valid signed webhook is accepted; an invalid signature returns `401`; duplicate delivery is harmless.
- [ ] `RESEND_INBOUND_WEBHOOK_SECRET` is present in Production.
- [ ] Vercel Cron requests are authorized with `CRON_SECRET` and unauthorized requests return `401`.
- [ ] Cron logs, failed outbox events, dead letters, and operations alerts have an owner and daily review cadence.

## 7. Security, privacy, and legal sign-off

- [ ] Turnstile works server-side and public endpoints reject missing/invalid challenges.
- [ ] Production security headers and HTTPS/HSTS are verified.
- [ ] File uploads are restricted to content-validated formats and size limits; unsafe spreadsheet ingestion is disabled or separately approved.
- [ ] Privacy notice accurately identifies Odoo, Resend, Cloudflare, and any AI processor that receives request/quote content.
- [ ] Retention schedule, deletion workflow, data-subject request workflow, breach response, and processor/cross-border transfer evidence have legal approval.
- [ ] Legal owner has determined whether Build acts as intermediary, seller of record, importer of record, or logistics principal.
- [ ] Commercial terms, customer complaints, cancellation/refund, delivery, warranty, CR/tax identity, and ZATCA obligations are approved for the actual business model.

## 8. Production smoke test and rollback

- [ ] `https://www.build.sa/` responds over HTTPS.
- [ ] `https://www.build.sa/api/health` reports the expected Odoo connection state without exposing secrets.
- [ ] Public customer, supplier, and carrier forms submit in Production using controlled test data.
- [ ] RFQ inbound test is performed with a benign supplier reply.
- [ ] Vercel, Odoo, Resend, and Upstash logs show no unhandled errors after the test.
- [ ] The previous deployment is identified and can be restored; the rollback decision owner is reachable.

## 9. Explicit no-go conditions

Do not launch automated RFQs or customer offers if any of these are true:

- Redis, Odoo, inbound Resend, or required secrets are unconfigured.
- Supplier matching is only category-level when the business promises product/SKU-specific routing.
- Tax, delivery, freight, FX, or final commercial obligations are ambiguous.
- Odoo role/record-rule access has not been tested.
- Privacy, processor, and cross-border-transfer evidence is incomplete.

Last updated: August 2026.

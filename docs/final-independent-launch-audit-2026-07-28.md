# BUILD.SA — Final Independent Red-Team Launch Audit

Date: 2026-07-28  
Branch: `audit/final-independent-20260728`  
Production deployment inspected: `dpl_Bm5j7dcjHYkcEH9XpYaq7wQiG7JS` (Ready, created 2026-07-27)

## 1. Final Verdict

`NO-GO`

## 2. Confidence

`HIGH` for the NO-GO decision. Multiple blockers were reproduced directly from Production,
the current Odoo schema, and executable tests. Confidence is not “complete certainty” about every
external system: Resend dashboard/domain/MX, Odoo record rules, real production business data,
and legal contracts were not accessible and are explicitly unverified.

## 3. Architecture Discovered

- Next.js 15 App Router deployed to Vercel.
- Public website and API routes share one application.
- Odoo Online is the sole operational data store and workflow engine.
- Odoo JSON-RPC is called directly from Vercel functions using one service credential.
- Resend sends OTP, registration, RFQ, operations, and customer-quote email.
- Resend Inbound is intended to receive supplier/carrier RFQ replies.
- DeepSeek extracts request lines and supplier prices from unstructured text/files.
- Vercel Cron invokes Odoo outbox, approval synchronization, winner selection, customer offers,
  and document-expiry processing.
- Cloudflare Turnstile is verified server-side.
- No Supabase runtime usage was found despite legacy/example environment comments.

## 4. Business Model Discovered

Build is an intermediary procurement platform:

1. A customer submits a building-material request and delivery location.
2. Operations reviews AI-suggested suppliers and carriers.
3. Local or international suppliers and carriers register and complete qualification.
4. Human approval in Odoo authorizes RFQ emails.
5. Supplier/carrier replies are extracted into structured quotes.
6. Two or more quotes trigger a comparison and human winner approval.
7. Supplier plus optional freight cost is marked up.
8. A second human approval authorizes a customer quotation email.

No purchase order, supplier bill, customer invoice, payment, settlement, ZATCA invoice, or
delivery-completion workflow was found in this repository. Those commercial completion steps are
manual, external, absent, or unverified.

## 5. Actors

- Customer/requester.
- Local supplier.
- International supplier.
- Manufacturer, authorized distributor, distributor, importer, exporter, trader, service provider.
- Carrier/logistics provider.
- Build operations staff.
- Odoo service user and human approvers.
- Resend.
- DeepSeek.
- Cloudflare Turnstile.
- Vercel Cron/runtime.

## 6. Complete Workflow Map

### Customer request

Customer → OTP → Turnstile → `/api/quotes/register` → validation → partner lookup/create →
project lookup/create → procurement request create → request lines/catalog extraction →
supplier/carrier recommendation → attachments → tracking generation → outbox event →
cron email → customer tracking.

### Supplier/carrier onboarding

Applicant → OTP → Turnstile → preliminary partner/profile → outbox confirmation →
operations approval → signed onboarding token → draft/documents → final profile submission →
operations approval/suspension/reactivation → matching eligibility.

### RFQ and quote

Operations approval → cron → RFQ email → supplier reply → Resend inbound webhook →
signature/timestamp check → Received Email API retrieval → tracking-number match →
sender-to-sent-communication match → DeepSeek extraction → supplier/freight quote →
comparison → human winner approval.

### Customer offer

Approved supplier winner + optional freight winner → current Odoo FX conversion →
cost/markup calculation → Odoo pricing fields → human approval → customer email.

### Failure points

- Every arrow that crosses Vercel/Odoo/Resend/DeepSeek is a separate transaction.
- Most multi-record workflows are non-atomic.
- Several “check then create” duplicate checks have no unique constraint.
- Main completion after customer quotation is not represented.

## 7. Critical Business Logic Findings

### CRITICAL — Customer request creation is non-atomic and non-idempotent

Exact durable sequence:

1. `findOrCreateCustomerPartner`
2. `findOrCreateCustomerProject`
3. `createProcurementRequest`
4. one request-line create per item, or extracted catalog product/tag/line creates
5. category/recommendation/task/approval/communication writes (errors partly swallowed)
6. one attachment create per file
7. tracking-token write
8. tracking Server Action
9. tracking read-back
10. outbox search
11. outbox create
12. HTTP success

Failure effects:

| Failure after | Remaining state |
|---|---|
| partner create | orphan/reusable partner |
| project create | project without request |
| request create | incomplete request |
| line N | request with only lines 1..N-1 |
| catalog create | orphan or incorrect catalog products/tags |
| attachment N | partially attached request |
| token/tracking | request with lines/files but no usable tracking |
| outbox | complete request unknown to customer/operations email flow |
| HTTP response loss | successful request is retried as a second request |

The retry has no submission identifier and always creates a new procurement request. Odoo inspection
confirmed no submission field and no relevant unique constraints. Concurrent identical submissions
can also duplicate partner, project, request, quotes, approvals, and outbox events.

Business impact: double RFQs, conflicting quotes, duplicate procurement/purchase action, missed
customer acknowledgement, incomplete BOQ, and unrecoverable customer uncertainty.

Safest root fix: one atomic Odoo model method/server action that accepts a stable client idempotency
key, enforces a database unique constraint, creates request + child lines + tracking + outbox in one
transaction, and returns the existing committed result on retry. Odoo Online must support and deploy
that model method/constraint, or a shared transactional idempotency store must reserve the key before
any Odoo write. In-memory locks and `search then create` are not acceptable.

### HIGH — Workflow stops after customer quote

No binding order acceptance, PO, invoice, bill, payment, delivery, cancellation/refund, or reconciliation
state machine is implemented here. Commercial completion is unverified.

## 8. Financial Integrity Findings

### CRITICAL — VAT and delivery flags are ignored by costing

`includesTax` and `includesDelivery` are stored but the total is always treated as cost:

- A tax-inclusive supplier total can be marked up including recoverable VAT.
- Customer email labels the sale price “excluding VAT” while no VAT amount/tax total is calculated.
- Freight can be added on top of a supplier total already including delivery.
- A supplier total excluding delivery can be sold without freight if no freight approval round exists.

This can overprice or underprice a real order. A human approval does not make an ambiguous calculation
financially correct.

Required fix: explicit normalized fields for net materials, input VAT, delivery component, freight,
other fees, taxable base, output VAT, gross total, currency rate/date/source, and approved override
reason. Block automatic offer generation whenever quote inclusions are unknown or contradictory.

### HIGH — Margin semantics are ambiguous

The configured percentage is markup on cost:

`sale = cost × (1 + markup%)`

The displayed gross margin percent is:

`(sale - cost) / sale`

For 15% markup, gross margin is 13.04%, not 15%. Labels distinguish them in Odoo summary, but policy,
minimum margin, discounts, VAT basis, and override governance are absent.

### HIGH — No invoice/bill reconciliation evidence

No accounting documents are created by this repository. Tax, invoice, bill, payment, and settlement
integrity are unverified.

## 9. Multi-Currency Findings

PASS evidence:

- Odoo company currency is SAR.
- Read-only Odoo query on 2026-07-28: SAR=1, USD=0.266667, EUR=0.2457.
- Conversion direction `SAR = foreign amount / Odoo rate` is correct.
- Tests proved SAR/USD/EUR conversion and the “apparently cheaper USD but actually costlier in SAR” case.
- Unknown/unavailable/invalid rates now return `null`.

Remaining HIGH risks:

- Rate date/source/value is not stored on the quote, comparison, winner decision, or customer offer.
- Comparison and later customer pricing re-read the current rate; the same approved quote can change
  SAR value between comparison and offer creation.
- No stale-rate threshold exists.
- No audit trail proves which rate produced a historical price.
- Unknown currency text silently defaults to SAR. This can turn an unrecognized foreign quote into SAR.

## 10. Odoo Findings

- Custom models discovered: procurement requests, request lines, supplier quotes/lines, supplier
  profiles, carrier profiles, AI tasks/approvals/communications, onboarding documents/drafts,
  material categories, service areas/logistics services, and integration outbox.
- Odoo read-only health/auth/model access passed.
- Current inspected database contained zero requests, quotes, communications, supplier profiles, and
  carrier profiles, but 22 outbox events.
- No SQL/model constraints were returned for request, quote, or outbox uniqueness.
- `ir.model.access`/record-rule metadata was unavailable to the API user:
  `UNVERIFIED IN PRODUCTION`.
- Server Action 929 generated tracking tokens deterministically; the branch now overrides it with a
  256-bit random token.
- Invalid-state protection depends heavily on Odoo selection fields and human actions, but many
  cross-model writes are separate transactions.

## 11. Supplier / Communication Findings

### BLOCKER — Production inbound is disabled

Benign POST to `https://www.build.sa/api/rfq/inbound-email` returned:

`503 {"error":"Inbound webhook is not configured"}`

Vercel environment listing confirmed `RESEND_INBOUND_WEBHOOK_SECRET` is absent from Production.

### BLOCKER in deployed code — Resend body handling was incompatible

Official Resend behavior: `email.received` carries metadata only. The deployed code expected `text`
or `html` in the webhook and would classify real replies as empty. The branch now retrieves content
using `email_id`, returns 500 on temporary retrieval failure so delivery can retry, and has tests.
This fix is not deployed.

### HIGH — Attachment-only quotes are not ingested

PDF/XLSX-only supplier replies are detected and alerted but are not converted to a quote. Manual
recovery exists only by operations alert and the protected manual intake endpoint.

### HIGH — Ambiguous association

Association uses tracking number in subject + sender email + latest sent communication. It does not
use a per-RFQ reply address/token or `In-Reply-To`/message ID. If the same partner has multiple
supplier/freight communications for one request, quote type can be ambiguous.

Branch fix: a partner in a draft recommendation is no longer accepted; communication must be `sent`.

## 12. Webhook / Idempotency Findings

PASS:

- Raw-body HMAC-SHA256 signature verification.
- Timing-safe comparison.
- Five-minute timestamp tolerance.
- Missing/invalid signature returns 401 when configured.

FAIL:

- Production secret absent.
- `svix-id` is not stored with a unique constraint.
- Duplicate quote/outbox/winner checks are `search then create`.
- Odoo has no uniqueness constraints for those keys.
- Cron event claiming is read-then-write; two cron invocations can both claim/send.
- Resend content-based idempotency mitigates identical email for its provider window only; it is not a
  durable business transaction guarantee.

## 13. Security Findings

- Production has CSP, HSTS, `nosniff`, and frame protection.
- Turnstile site and secret keys exist in Production and verification is server-side/fail-closed.
- Rate limiting is process-memory only; on Vercel scaling/cold starts it is not a reliable control.
- OTP is deterministic per email/time window, and brute-force defense relies on that same in-memory limit.
- Quote request attachments trust declared MIME/extension and can reach vulnerable parsers.
- Dependency scan still reports high advisories in `xlsx` and nested Next build/image dependencies.
- No exploitative production testing was performed.

## 14. Authorization Findings

- Customer project lookup/delete requires a verified-email token and checks ownership.
- Tracking uses a bearer token; branch replaces deterministic Odoo token with 256-bit random value.
- Onboarding endpoints use signed, scoped, expiring tokens and profile-status checks.
- RFQ manual intake requires `CRON_SECRET`.
- Inbound sender must now correspond to an actually sent communication.
- Odoo human-user groups and record rules: `UNVERIFIED IN PRODUCTION`.
- Service credential is effectively privileged across all custom models; compromise has broad impact.

## 15. Privacy Findings

### HIGH / Requires legal review

- Privacy notice omits DeepSeek even though customer BOQ/text and supplier reply content are sent there.
- Vercel hosting/processing is not named.
- Cross-border statement claims safeguards without evidence of transfer assessment/contracts.
- Retention is indefinite/vague and no deletion automation was found.
- No data-subject request workflow, processing register, DPIA, breach runbook, or processor-contract
  evidence was available.
- Official-document copies and bank letters are collected; necessity/minimization requires review.

## 16. Regulatory Findings

### Mandatory or likely mandatory

- Saudi PDPL: privacy notice, lawful purpose, minimization, security, data-subject rights, processor
  controls, retention/destruction, breach handling, and cross-border transfer controls.
- E-Commerce Law if Build concludes electronic sales/services: provider identity/contact/CR/tax ID,
  contract steps, total price including charges/taxes, payment/delivery/warranty/complaints, and
  consumer rights.
- ZATCA VAT/e-invoicing if Build is the taxable supplier issuing invoices.

### Conditionally applicable

- ZATCA Phase 2 integration depends on taxpayer wave and turnover; no evidence was available.
- Transport/customs/import licensing depends on whether Build contracts as carrier/importer of record.
- NCA ECC applies directly to covered government/CNI entities; other private organizations should
  apply the dedicated 2025 private-sector controls or ECC as best practice.

### Requires legal review

- Whether Build is agent, marketplace intermediary, seller of record, importer of record, or logistics
  principal. Terms say “intermediary,” but pricing/markup and customer quotation behavior may indicate
  a principal sale.
- Refund, cancellation, warranty, transport exemption, customs, and product conformity obligations.

No compliance PASS is issued.

## 17. Production Findings

- `build.sa` redirects to `www.build.sa`; HTTPS and HSTS work.
- `/api/health` reports Odoo connected/authenticated/models accessible.
- Public categories endpoint works.
- Protected cron/manual RFQ endpoints returned 401 without authorization.
- Inbound returned 503 because it is unconfigured.
- Deployment is Ready but does not contain branch fixes.
- Production environment still contains legacy ERPNext/IMAP variables, increasing configuration ambiguity.
- No shared rate-limit store exists.
- `metadataBase` build warning falls back to localhost for generated social metadata.

## 18. Reliability / Failure-Recovery Findings

- Odoo transport retries network/timeouts, but retrying non-idempotent creates can duplicate records
  if the server committed before the client timed out.
- Outbox retries with backoff/dead-letter and records last error.
- Outbox claim is not atomic.
- Customer request has no compensating transaction or resumable submission state.
- DeepSeek request extraction failure can leave a request without lines and continue.
- Recommendation failure is deliberately non-blocking and only logged.
- Resend inbound retrieval now returns retryable 500 on provider failure in branch.
- There is no end-to-end reconciliation job for orphan/duplicate/incomplete requests.

## 19. Test Matrix

| Scenario | Expected | Actual | Result | Evidence |
|---|---|---|---|---|
| Production homepage | 200 + security headers | 200 | PASS | direct HTTP |
| Production health/Odoo | connected/authenticated | true/true | PASS | `/api/health` |
| Cron without secret | 401 | 401 | PASS | direct HTTP |
| Manual quote intake without secret | 401 | 401 | PASS | direct HTTP |
| Inbound configured | signature validation path | 503 before validation | FAIL | direct HTTP |
| Resend webhook body | retrieve by `email_id` | deployed code expected inline body | FAIL | official contract + code |
| Retrieved text reply | body available | branch retrieves it | PASS | automated test |
| Retrieved HTML reply | sanitized text | branch converts it | PASS | automated test |
| Attachment-only reply | safe recovery | alert/manual only | FAIL | automated test |
| SAR conversion | unchanged | 100→100 | PASS | automated test |
| USD conversion | inverse Odoo rate | 100→375 | PASS | automated test |
| EUR conversion | inverse Odoo rate | 100→407 | PASS | automated test |
| Cheaper-looking USD | compare real SAR | SAR 360 beats USD 100 (=375) | PASS | automated test |
| Missing FX | block auto price | null/review | PASS | automated test + code |
| FX snapshot | reproducible historical rate | not stored | FAIL | schema/code |
| VAT normalization | consistent net/tax/gross | flags ignored | FAIL | code |
| Delivery normalization | no omission/double count | flags ignored | FAIL | code |
| Duplicate customer retry | same request returned | new request possible | FAIL | code/schema |
| Concurrent quote/outbox | one record | race possible, no constraint | FAIL | code/schema |
| Tracking token strength | cryptographic bearer | deployed deterministic; branch random | FAIL Production / PASS branch | Odoo action + test |
| Draft supplier reply | reject until sent | branch requires sent | PASS branch | code |
| PDF MIME mismatch onboarding | reject | PDF magic required | PASS | code review |
| Quote file MIME mismatch | reject | declared metadata trusted | FAIL | code review |
| Server-side Turnstile | fail closed | configured + server verified | PASS code/config | code + env names |
| Distributed rate limit | durable | in-memory only | FAIL | code |
| Lint | clean | clean | PASS | `npm run lint` |
| Typecheck | clean | clean | PASS | `npm run typecheck` |
| Unit/regression tests | clean | 10/10 | PASS | `npm test` |
| Production build | success | success | PASS | `npm run build` |
| Dependency audit | no high issues | high issues remain | FAIL | `npm audit --omit=dev` |

## 20. Findings Fixed By You

1. Resend received-email body retrieval:
   root cause was an incorrect webhook payload assumption; branch calls Received Email API, retries
   provider failure, and includes regression tests.
2. Deterministic tracking bearer token:
   branch writes a 256-bit random token before Odoo Server Action; 1,000-token uniqueness/format test.
3. Draft/recommended partner accepted as RFQ sender:
   sender association now requires an actually `sent` communication.
4. Currency functions:
   moved into a testable pure module, reject invalid/negative values, and added SAR/USD/EUR/comparison tests.
5. Test/typecheck scripts:
   added runnable unit suite and explicit typecheck.
6. Dependency patching:
   upgraded Next/PostCSS/Sharp and relevant overrides; audit count fell, but high issues remain.

All fixes are local and undeployed.

## 21. Remaining Blockers

1. Atomic, durable customer-request idempotency with unique constraint.
2. Configure and prove Resend inbound domain/MX/webhook/secret in Production.
3. Deploy and verify Received Email API fix.
4. Define and implement VAT/delivery/freight normalization before automatic customer pricing.
5. Prove the complete commercial order/invoice/delivery flow or explicitly constrain launch scope.
6. Resolve high-risk file parser dependency or disable spreadsheet ingestion.

## 22. Remaining High Risks

- No FX snapshot/staleness control.
- Attachment-only supplier quote cannot be ingested.
- Ambiguous supplier-vs-freight reply association.
- No atomic outbox/quote/winner constraints.
- Distributed rate limiting absent.
- Quote file MIME/content validation incomplete.
- Odoo human record rules unverified.
- Privacy/processor/cross-border evidence incomplete.
- Incomplete observability and no reconciliation job.

## 23. External Items Not Verifiable

`UNVERIFIED EXTERNAL DEPENDENCY`:

- Resend inbound domain, MX, webhook selection, delivery/replay dashboard, bounce handling.
- DeepSeek account limits, data residency, retention, DPA, outage behavior.
- Odoo human groups/record rules, backup/restore, audit-log retention, real production data.
- Vercel/Resend/Odoo/DeepSeek cross-border contracts and PDPL safeguards.
- ZATCA taxpayer registration/wave/integration.
- Commercial registration, tax ID, licenses, customs/importer status, insurance.
- Actual supplier/customer/carrier end-to-end acceptance test.

## 24. Launch Checklist

- [ ] Implement atomic idempotent request RPC + unique key.
- [ ] Add unique constraints for quote, outbox, winner/customer-offer decisions, and webhook event ID.
- [ ] Deploy branch fixes.
- [ ] Configure Resend inbound and prove a real benign text reply end to end.
- [ ] Define attachment-only quote recovery.
- [ ] Implement net/VAT/delivery/freight/fees/gross financial model.
- [ ] Store FX rate, date, source, and quote-time snapshot.
- [ ] Resolve `xlsx`/nested dependency advisories.
- [ ] Add shared rate limiting and OTP attempt state.
- [ ] Add request correlation/submission IDs and orphan reconciliation.
- [ ] Verify Odoo access groups/rules with non-admin test users.
- [ ] Complete privacy, transfer, DPIA, retention, breach, and processor evidence.
- [ ] Confirm seller/intermediary/importer/legal model and applicable MOC/ZATCA obligations.
- [ ] Run staged end-to-end customer/local supplier/international supplier/carrier tests.
- [ ] Re-run this audit against the deployed commit.

## 25. Final Answer

- Can a customer use the website? The form is available, but reliable submission is not guaranteed: **No launch approval**.
- Can a supplier use registration? The flow exists, but end-to-end real supplier operation is unverified.
- Do all discovered supplier types work? Local/international branches exist; end-to-end proof is absent.
- Do logistics work? Matching/RFQ exists; pricing and completion integrity fail.
- Are currencies correct? Conversion direction is correct; auditability/staleness is not.
- Is margin correct? Arithmetic is correct for markup-on-cost; tax/delivery basis is not.
- Are taxes correct? **No**.
- Is duplicate protection reliable? **No**.
- Does supplier reply reach the right place? **No in Production today**.
- Is Odoo consistent? Schema is reachable; transactional consistency is not guaranteed.
- Does the system recover safely from external failure? Partly; request creation and concurrency do not.
- Is there a launch-blocking vulnerability? Yes: deterministic deployed tracking bearer design (fixed only locally)
  and non-durable authorization/idempotency controls.
- Is there a launch-blocking financial risk? **Yes**: VAT/delivery/freight ambiguity and non-atomic duplicates.

Final engineering signature: `NO-GO`.

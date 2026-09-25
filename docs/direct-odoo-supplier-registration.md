# Direct supplier registration — 2026-09-19

The public Arabic and English supplier forms use the Next.js server on Vercel
to reach native Odoo JSON-2 endpoints. Build-OPT is no longer required for this
flow, including the category picker.

## Configuration

Set server-only `VENDOR_ODOO_BASE_URL`, `VENDOR_ODOO_DATABASE`, and
`VENDOR_ODOO_API_KEY`. The vendor-specific variables take precedence over the
legacy `ODOO_*` values so other, older workflows retain their existing settings.
The target is `https://buildsaudi.odoo.com`, database `buildsaudi`.
Never put an API key in a `NEXT_PUBLIC_*` variable or commit local env files.
Set `NEXT_PUBLIC_VENDOR_REGISTRATION_MOCK=false` before building/deploying.
Keep the existing Turnstile site and secret keys configured.

## Odoo records

- A company in `res.partner` with `supplier_rank=1` and existing `Supplier` and
  `pending_review` tags. Review does not grant approval automatically.
- Its contact person is created via `child_ids` in the same Odoo transaction.
- Country is resolved by ISO code; IDs are never hardcoded.
- Product categories are validated against `product.category`.
- Categories, brands, supplier/business type, description, catalog link, other
  category suggestion, language, consent, and submission time are saved in
  escaped HTML notes on the supplier. Categories and brands are readable notes,
  not custom relational fields. No `x_build_*` model is required or created.
- No confirmation emails or notifications are sent by this registration flow.

## Retries and limitations

The Odoo reference is a deterministic hash of company, country and email.
Repeated submissions are reconciled through that reference; existing suppliers
are also checked by exact company/country plus email or phone. A failed create
is reconciled by reading its reference, never blindly retried. The public API
does not expose partner IDs or internal Odoo errors.

The existing shared store uses Redis when configured, otherwise memory per
server instance. Without shared Redis (the current production configuration),
simultaneous identical submissions on different Vercel instances can still race.
The reference is not a database uniqueness constraint. Ordinary subsequent
retries are deduplicated through Odoo, but cross-instance exactly-once creation
is not guaranteed. Existing rate limiting also remains per instance.

## Verification and operations

- `node --experimental-strip-types --test lib/vendor-registration*.test.ts`
  exercises the actual registration handler and Odoo payloads against a fake
  transport, including CAPTCHA rejection, consent, duplicate lookup, atomic
  contact payload, escaped HTML, lost replies, and corrected validation retries.
- Run `npm run typecheck`, `npm run lint`, and `npm run build`.
- Read-only `GET /api/health/supplier-registration` checks authentication and
  access to native registration models; `GET /api/reference/material-categories`
  checks live catalog retrieval. The older `/api/health` still checks legacy
  integrations and does not represent this new registration path.
- No real supplier was created by automated verification. A human submission
  with a genuine Turnstile token remains the final production end-to-end check.
- Baseline full-suite issue: `lib/shared-store.test.ts` expects production to
  reject missing Redis, while the unchanged shared store deliberately falls
  back to memory. This pre-existing test fails independently of this change.
- Rollback: promote the previous Vercel deployment. Vendor-specific env variables
  are unused by the old code and can remain while investigating.

## Deployment evidence

- Deployed and promoted on 2026-09-19:
  `https://buildsaudi-ay0yg1mbd-sulaimans-projects-be250e4d.vercel.app`
  (`dpl_7SuvXXxxTWZLfovNygMXytkbwyA4`).
- Previous production deployment: `dpl_62y5BAQRpMSJonyXKpo1qqdsV7pK`.
- Public `/ar/register` and `/register`: HTTP 200, real registration form present,
  paused notice absent, prototype notice absent.
- Public `/api/health/supplier-registration`: HTTP 200, `authenticated: true`.
- Public `/api/reference/material-categories`: HTTP 200, ten categories from Odoo.
- Fifteen targeted tests passed; typecheck and production build passed. Lint
  passed with three existing React Hook Form warnings in unrelated forms.
- Browser verified navigation from company details to live Odoo categories and
  contact details locally, plus the public production registration page.
- Existing production analytics CSP warnings and automated-browser Turnstile
  diagnostics were observed; CAPTCHA was not bypassed and no form was submitted.
- Source changes remain in the local working tree; production was deployed by
  Vercel CLI, not a GitHub push.

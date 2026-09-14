# Build Saudi

Build Saudi is a bilingual Next.js platform for construction-material sourcing in Saudi Arabia. It handles customer quote requests, vendor onboarding, RFQ workflows, offer approval links, admin operations, uploads, and vendor contract signatures.

## Stack

- Next.js 15 App Router + React 19
- TypeScript
- Tailwind CSS
- Odoo Online for operational records and approvals
- Upstash Redis for distributed idempotency and rate limits
- Resend transactional email
- Vercel deployment

## Project Structure

```txt
app/                 App Router pages and API routes
components/          Shared UI, forms, layout, and marketing sections
lib/                 Supabase clients, auth, email, rate limit, site config
public/              Static brand and image assets
supabase/            Schema, migrations, RLS hardening, and admin RBAC SQL
PRODUCTION_CHECKLIST.md
                     Production readiness and deployment checklist
```

## Getting Started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Local API flows require valid Odoo credentials. Production public workflows also require Upstash Redis, Resend, Turnstile, and the token secrets listed in `.env.local.example`.

## Environment Variables

Core server-side configuration:

```bash
ODOO_BASE_URL=
ODOO_DATABASE=
ODOO_USERNAME=
ODOO_API_KEY=
RESEND_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
CRON_SECRET=
OTP_SECRET=
VENDOR_ONBOARDING_TOKEN_SECRET=
UPLOAD_TOKEN_SECRET=
RESEND_INBOUND_WEBHOOK_SECRET=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_APP_URL=
```

Optional compatibility alias:

```bash
NEXT_PUBLIC_SITE_URL=
```

Never expose Odoo, Redis, Resend, DeepSeek, cron, or token secrets as `NEXT_PUBLIC_*` variables.

## Operational setup

Odoo is the operational system of record for requests, profiles, RFQs, approvals, quotations, and the integration outbox. Configure the required custom models/fields and human roles before enabling public workflows.

Upstash Redis is mandatory in Production: it provides atomic submission claims and distributed rate limits. The application fails closed for protected operations if it is unavailable.

Resend handles outbound OTP/RFQ messages and inbound supplier replies. Configure the inbound domain, MX records, `email.received` webhook, and `RESEND_INBOUND_WEBHOOK_SECRET` before enabling automated RFQ intake.

## Quality Checks

```bash
npm audit
npm run lint
npx tsc --noEmit
npm run build
```

Expected result: zero audit vulnerabilities, zero ESLint warnings, zero TypeScript errors, and a successful production build.

## Main API Surface

- `POST /api/quotes/register` creates idempotent public procurement requests with server-side validation.
- `POST /api/vendors/register` creates public vendor registrations with server-side validation.
- `POST /api/carriers/register` creates public carrier registrations with server-side validation.
- `POST /api/rfq/inbound-email` receives signed Resend inbound replies and records quotes.
- `POST /api/rfq/quote-intake` is a protected manual recovery endpoint.
- `/api/cron/odoo-outbox` dispatches authorized operational events.
- `GET /api/health` returns a lightweight deployment health response.

## Deployment

Use Vercel with the configuration in `.env.local.example` and the release gates in `PRODUCTION_CHECKLIST.md`. After changing any environment variable, redeploy and run the production smoke tests.

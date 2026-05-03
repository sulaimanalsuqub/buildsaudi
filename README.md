# Build Saudi

Build Saudi is a bilingual Next.js platform for construction-material sourcing in Saudi Arabia. It handles customer quote requests, vendor onboarding, RFQ workflows, offer approval links, admin operations, uploads, and vendor contract signatures.

## Stack

- Next.js 15 App Router + React 19
- TypeScript
- Tailwind CSS
- Supabase Auth, Database, Storage, and RLS
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

Local admin/API flows require valid Supabase and Resend values in `.env.local`.

## Environment Variables

Required:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
ADMIN_EMAIL=
NEXT_PUBLIC_APP_URL=
```

Optional compatibility alias:

```bash
NEXT_PUBLIC_SITE_URL=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it as a `NEXT_PUBLIC_*` variable.

## Supabase Setup

Run SQL files in this order for a new Supabase project:

1. `supabase/schema.sql`
2. `supabase/admin-rbac.sql`
3. `supabase/migrations.sql`
4. `supabase/rls-hardening.sql`

Then create the first admin user:

```sql
select public.register_admin('AUTH_USER_UUID', 'admin@build.sa', 'admin');
```

Storage:

- Bucket name: `documents`
- Current upload route stores BOQ files, contracts, and general files under folder prefixes.
- Public quote BOQ uploads are allowed through `/api/upload`.
- Contract and general uploads require an authenticated admin session.

## Quality Checks

```bash
npm audit
npm run lint
npx tsc --noEmit
npm run build
```

Expected result: zero audit vulnerabilities, zero ESLint warnings, zero TypeScript errors, and a successful production build.

## Main API Surface

- `POST /api/quotes` creates public quote requests with server-side validation.
- `POST /api/vendors/register` creates public vendor registrations with server-side validation.
- `POST /api/upload` validates file type/size and stores uploads through the service role client.
- `POST /api/offer/respond` handles token-based client offer responses.
- `POST /api/vendor/sign` handles token-based vendor contract signing.
- `/api/admin/*` routes require admin authorization and rate limiting.
- `GET /api/health` returns a lightweight deployment health response.

## Deployment

Use Vercel with these production environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
ADMIN_EMAIL
NEXT_PUBLIC_APP_URL=https://www.build.sa
NEXT_PUBLIC_SITE_URL=https://www.build.sa
```

After changing any environment variable, redeploy the project. Use `PRODUCTION_CHECKLIST.md` before and after deployment.

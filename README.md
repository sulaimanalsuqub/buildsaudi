# Build Saudi

Build Saudi is a Next.js application for managing construction-material quote requests, vendor onboarding, RFQs, offers, and vendor contract signatures.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth, Database, Storage, and RLS
- Resend transactional email

## Project Structure

```txt
app/                 Next.js routes, pages, layouts, and API handlers
components/          Shared UI, forms, layout, and marketing sections
lib/                 Supabase clients, auth helpers, email, rate limiting, utilities
public/brand/        Build Saudi brand assets
supabase/            Database schema, migrations, RLS, and admin RBAC SQL
PRODUCTION_CHECKLIST.md
                     Deployment and production readiness checklist
```

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local environment variables:

   ```bash
   cp .env.local.example .env.local
   ```

3. Fill these required values in `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   RESEND_API_KEY=
   ADMIN_EMAIL=
   NEXT_PUBLIC_APP_URL=
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

## Quality Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

`npm run build` requires valid Supabase and app environment variables because the app renders server routes and admin pages during the build.

## Supabase Setup

Run the SQL files in this order when preparing a new Supabase project:

1. `supabase/schema.sql`
2. `supabase/migrations.sql`
3. `supabase/rls-hardening.sql`
4. `supabase/admin-rbac.sql`

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Do not expose it in client components or public environment variables.

## Deployment

Use `PRODUCTION_CHECKLIST.md` before going live. It covers environment variables, Supabase security, email setup, storage, QA, and post-deployment checks.

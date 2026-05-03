# Production Checklist - Build Saudi

Use this checklist before deploying or redeploying production.

## 1. Code Quality

- [ ] `npm install` completed successfully.
- [ ] `npm audit` returns `found 0 vulnerabilities`.
- [ ] `npm run lint` passes with no warnings.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` passes.
- [ ] No obsolete API routes remain referenced by forms or admin pages.

## 2. Environment Variables

Required in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
ADMIN_EMAIL=admin@build.sa
NEXT_PUBLIC_APP_URL=https://www.build.sa
NEXT_PUBLIC_SITE_URL=https://www.build.sa
```

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is not prefixed with `NEXT_PUBLIC_`.
- [ ] Production and preview environments have the correct values.
- [ ] Project was redeployed after any environment variable change.

## 3. Supabase Database

Run SQL in this order:

1. [ ] `supabase/schema.sql`
2. [ ] `supabase/admin-rbac.sql`
3. [ ] `supabase/migrations.sql`
4. [ ] `supabase/rls-hardening.sql`

Register the first admin:

```sql
select public.register_admin('AUTH_USER_UUID', 'admin@build.sa', 'admin');
```

Verify:

- [ ] `admin_users` exists and contains the production admin user.
- [ ] RLS is enabled on application tables.
- [ ] Public quote/vendor writes go through `/api/quotes` and `/api/vendors/register`.
- [ ] Admin mutations go through `/api/admin/*`.
- [ ] Offer and vendor-signature token flows go through server API routes.
- [ ] Indexes from `supabase/migrations.sql` exist for quote/RFQ/admin workflows.

## 4. Supabase Storage

- [ ] Bucket `documents` exists.
- [ ] Bucket settings match the chosen access model.
- [ ] BOQ uploads are accepted from public quote forms.
- [ ] Contract and general uploads require an authenticated admin session.
- [ ] File size and MIME restrictions are verified:
  - BOQ: PDF, XLSX, XLS, CSV up to 10MB.
  - Contracts: PDF up to 10MB.
  - General: PDF, Office, image, CSV up to 20MB.

## 5. Auth and Admin

- [ ] `/admin/login` loads in production.
- [ ] Unauthenticated `/api/admin/me` returns `401`.
- [ ] Non-admin authenticated users cannot access `/admin`.
- [ ] Active admin users can access Quotes, Vendors, Brands, Contracts, and Users.
- [ ] Admin invite redirects to `https://www.build.sa/admin`.
- [ ] Admin-only pages use server-side admin checks.

## 6. Workflow QA

- [ ] Customer submits quote request and receives a success message.
- [ ] Admin receives new quote email.
- [ ] Admin can add quote items and internal notes.
- [ ] Admin can create RFQs for active vendors.
- [ ] Admin can record vendor quotes.
- [ ] Admin can record freight quotes.
- [ ] Admin can send an offer link.
- [ ] Client can accept/reject an offer link once.
- [ ] Vendor can register and receives confirmation.
- [ ] Admin can approve, pause, reject, or delete vendors.
- [ ] Admin can assign/remove vendor brands.
- [ ] Admin can upload a contract PDF.
- [ ] Admin can send/re-send contract signing links.
- [ ] Vendor can sign a contract link once.

## 7. Email

- [ ] Resend API key is active.
- [ ] Sending domain is verified.
- [ ] SPF, DKIM, and DMARC records are configured.
- [ ] `ADMIN_EMAIL` receives admin notifications.
- [ ] Test emails render Arabic text correctly.
- [ ] Links in emails use `https://www.build.sa`.

## 8. Security

- [ ] Rate limiting is active on public, upload, offer, vendor, and admin endpoints.
- [ ] Public API inputs are validated with Zod or explicit checks.
- [ ] File uploads validate MIME type, size, and path extension.
- [ ] Service role client is used only in server routes/server components.
- [ ] No service role key is referenced from client components.
- [ ] Security headers are active through `next.config.ts`.
- [ ] Public table policies are intentionally limited.

## 9. Deployment Smoke Test

After Vercel deployment:

- [ ] `https://www.build.sa/` returns 200.
- [ ] `https://www.build.sa/admin/login` returns 200.
- [ ] `https://www.build.sa/api/health` returns `{ "ok": true }`.
- [ ] `https://www.build.sa/api/admin/me` returns 401 when logged out.
- [ ] Public quote form submits successfully.
- [ ] Vendor registration form submits successfully.
- [ ] Admin login works with the production admin account.
- [ ] Check Vercel logs for runtime errors after smoke tests.

## 10. Operations

- [ ] Database backups are enabled.
- [ ] Supabase project access is restricted to trusted admins.
- [ ] Vercel project access is restricted to trusted admins.
- [ ] Error monitoring is configured if required.
- [ ] Uptime monitoring pings `/api/health`.
- [ ] Dependency updates are reviewed regularly with `npm audit`.

Last updated: May 2026

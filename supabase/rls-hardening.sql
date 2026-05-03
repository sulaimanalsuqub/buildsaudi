-- ============================================================
--  Build Saudi — RLS Hardening Migration
--  Run this in Supabase → SQL Editor → New Query
--  ⚠️ Required before production launch
-- ============================================================

-- ──────────────────────────────────────────────
--  BRANDS TABLE — public read, writes go through server admin API
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manages brands" ON public.brands;
DROP POLICY IF EXISTS "Public can read brands" ON public.brands;

CREATE POLICY "Public can read brands" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "Admin manages brands" ON public.brands
  FOR ALL USING (false);

-- ──────────────────────────────────────────────
--  VENDOR_BRANDS TABLE — public read, writes go through server admin API
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manages vendor_brands" ON public.vendor_brands;
DROP POLICY IF EXISTS "Public can read vendor_brands" ON public.vendor_brands;

CREATE POLICY "Public can read vendor_brands" ON public.vendor_brands
  FOR SELECT USING (true);

CREATE POLICY "Admin manages vendor_brands" ON public.vendor_brands
  FOR ALL USING (false);

-- ──────────────────────────────────────────────
--  CONTRACTS TABLE — all access goes through server routes
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manages contracts" ON public.contracts;
DROP POLICY IF EXISTS "Public can read active contracts" ON public.contracts;

CREATE POLICY "Admin manages contracts" ON public.contracts
  FOR ALL USING (false);

-- ──────────────────────────────────────────────
--  CLIENT_OFFERS TABLE — public access goes through server token routes
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can read offer by token" ON public.client_offers;
DROP POLICY IF EXISTS "Service role manages client_offers" ON public.client_offers;

CREATE POLICY "Service role manages client_offers"
  ON public.client_offers USING (false);

-- ──────────────────────────────────────────────
--  VENDOR_CONTRACT_SIGNATURES
--  Public signing goes through a server route and service role client
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manages signatures" ON public.vendor_contract_signatures;
DROP POLICY IF EXISTS "Vendor can sign via token" ON public.vendor_contract_signatures;
DROP POLICY IF EXISTS "Public can sign via token" ON public.vendor_contract_signatures;
DROP POLICY IF EXISTS "Public can read via token" ON public.vendor_contract_signatures;

-- Only server routes using the service role can INSERT/UPDATE/DELETE signatures.
CREATE POLICY "Admin manages signatures" ON public.vendor_contract_signatures
  FOR ALL USING (false);

-- Public contract-signing pages use server-side API routes with service role.
-- Do not expose signatures through anon RLS: token checks happen in application code.

-- ──────────────────────────────────────────────
--  ADMIN_USERS TABLE — fix circular RLS
--  Use service-role-only access (app code uses service role client)
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Service role manages admin_users" ON public.admin_users;

-- Block all client-side access — app uses service role to bypass this
CREATE POLICY "Service role only" ON public.admin_users USING (false);

-- ──────────────────────────────────────────────
--  PUBLIC FORM TABLES — writes go through server API routes
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can register as vendor" ON public.vendors;
DROP POLICY IF EXISTS "Anyone can insert vendor_categories" ON public.vendor_categories;
DROP POLICY IF EXISTS "Anyone can insert vendor_regions" ON public.vendor_regions;
DROP POLICY IF EXISTS "Anyone can submit a quote" ON public.quotes;

-- ──────────────────────────────────────────────
--  QUOTES TABLE — ensure only service role reads quotes
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Service role reads quotes" ON public.quotes;

CREATE POLICY "Service role reads quotes" ON public.quotes FOR SELECT USING (false);
CREATE POLICY "Service role updates quotes" ON public.quotes FOR UPDATE USING (false);
CREATE POLICY "Service role deletes quotes" ON public.quotes FOR DELETE USING (false);

-- Done ✅
SELECT 'RLS hardening complete' as status;

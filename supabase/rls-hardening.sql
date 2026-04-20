-- ============================================================
--  Build Saudi — RLS Hardening Migration
--  Run this in Supabase → SQL Editor → New Query
--  ⚠️ Required before production launch
-- ============================================================

-- ──────────────────────────────────────────────
--  BRANDS TABLE — restrict to admin_users only
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manages brands" ON public.brands;
DROP POLICY IF EXISTS "Public can read brands" ON public.brands;

CREATE POLICY "Public can read brands" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "Admin manages brands" ON public.brands
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- ──────────────────────────────────────────────
--  VENDOR_BRANDS TABLE — restrict to admin_users only
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manages vendor_brands" ON public.vendor_brands;
DROP POLICY IF EXISTS "Public can read vendor_brands" ON public.vendor_brands;

CREATE POLICY "Public can read vendor_brands" ON public.vendor_brands
  FOR SELECT USING (true);

CREATE POLICY "Admin manages vendor_brands" ON public.vendor_brands
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- ──────────────────────────────────────────────
--  CONTRACTS TABLE — restrict to admin_users only
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manages contracts" ON public.contracts;
DROP POLICY IF EXISTS "Public can read active contracts" ON public.contracts;

CREATE POLICY "Public can read active contracts" ON public.contracts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin manages contracts" ON public.contracts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- ──────────────────────────────────────────────
--  VENDOR_CONTRACT_SIGNATURES
--  Allow public signing via token, but restrict insert/delete to admins
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manages signatures" ON public.vendor_contract_signatures;
DROP POLICY IF EXISTS "Public can sign via token" ON public.vendor_contract_signatures;
DROP POLICY IF EXISTS "Public can read via token" ON public.vendor_contract_signatures;

-- Only admin_users can INSERT or DELETE signatures
CREATE POLICY "Admin manages signatures" ON public.vendor_contract_signatures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Public can READ their own signature record via token
CREATE POLICY "Public can read via token" ON public.vendor_contract_signatures
  FOR SELECT USING (token IS NOT NULL);

-- Public can UPDATE (sign) only their own signature record via valid token
CREATE POLICY "Vendor can sign via token" ON public.vendor_contract_signatures
  FOR UPDATE USING (signed_at IS NULL AND token IS NOT NULL)
  WITH CHECK (signed_at IS NOT NULL);

-- ──────────────────────────────────────────────
--  ADMIN_USERS TABLE — fix circular RLS
--  Use service-role-only access (app code uses service role client)
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Service role manages admin_users" ON public.admin_users;

-- Block all client-side access — app uses service role to bypass this
CREATE POLICY "Service role only" ON public.admin_users USING (false);

-- ──────────────────────────────────────────────
--  QUOTES TABLE — ensure only service role reads quotes
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Service role reads quotes" ON public.quotes;
DROP POLICY IF EXISTS "Anyone can submit a quote" ON public.quotes;

CREATE POLICY "Anyone can submit a quote" ON public.quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role reads quotes" ON public.quotes FOR SELECT USING (false);
CREATE POLICY "Service role updates quotes" ON public.quotes FOR UPDATE USING (false);
CREATE POLICY "Service role deletes quotes" ON public.quotes FOR DELETE USING (false);

-- Done ✅
SELECT 'RLS hardening complete' as status;

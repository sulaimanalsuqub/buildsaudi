-- ============================================================
--  Admin Role-Based Access Control (RBAC)
--  Run this in Supabase → SQL Editor
-- ============================================================

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  -- 'admin' | 'moderator' | 'viewer'
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role manages admin_users"
  ON public.admin_users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins can view admin users
CREATE POLICY "Admins can view admin_users"
  ON public.admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid()
      AND is_active = true
      AND role IN ('admin')
    )
  );

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = user_id
    AND is_active = true
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Create function to check admin role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.admin_users
  WHERE id = user_id AND is_active = true
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_admin_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_users_timestamp ON public.admin_users;
CREATE TRIGGER update_admin_users_timestamp
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_admin_users_timestamp();

-- Create function to register first admin (from service role)
CREATE OR REPLACE FUNCTION public.register_admin(p_user_id UUID, p_email TEXT, p_role TEXT DEFAULT 'admin')
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  INSERT INTO public.admin_users (id, email, role, is_active)
  VALUES (p_user_id, p_email, p_role, true)
  ON CONFLICT (email) DO UPDATE
  SET role = p_role, is_active = true, updated_at = now()
  RETURNING json_build_object(
    'id', id,
    'email', email,
    'role', role,
    'is_active', is_active
  ) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

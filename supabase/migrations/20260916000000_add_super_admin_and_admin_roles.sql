-- ==============================================================================
-- BENUE MARKET — SUPER ADMIN & ROLE-BASED ACCESS CONTROL (RBAC) MIGRATION
-- Platform: Supabase PostgreSQL (PostgreSQL 15+)
-- Super Admin: keghtorterhemba19@gmail.com
-- ==============================================================================

-- 1. Extend user_role ENUM to include 'super_admin'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 2. Add status & suspension fields to profiles if not exists
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- 3. Super Admin Profile Helper Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'buyer';
  v_lga benue_lga := 'Makurdi';
  v_meta_role text;
  v_meta_lga text;
  v_is_super boolean := FALSE;
BEGIN
  -- Check if super admin email
  IF LOWER(NEW.email) = 'keghtorterhemba19@gmail.com' THEN
    v_role := 'super_admin';
    v_is_super := TRUE;
  ELSE
    v_meta_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'));
    IF v_meta_role IN ('seller', 'farmer') THEN
      v_role := 'seller';
    ELSIF v_meta_role = 'super_admin' THEN
      v_role := 'super_admin';
      v_is_super := TRUE;
    ELSIF v_meta_role = 'admin' THEN
      v_role := 'admin';
    ELSE
      v_role := 'buyer';
    END IF;
  END IF;

  v_meta_lga := COALESCE(NEW.raw_user_meta_data->>'lga', 'Makurdi');
  BEGIN
    v_lga := v_meta_lga::benue_lga;
  EXCEPTION WHEN OTHERS THEN
    v_lga := 'Makurdi';
  END;

  INSERT INTO public.profiles (id, name, email, phone, role, lga, is_super_admin, is_verified, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '08000000000'),
    v_role,
    v_lga,
    v_is_super,
    v_is_super OR v_role = 'seller',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    is_super_admin = EXCLUDED.is_super_admin;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

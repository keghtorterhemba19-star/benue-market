-- ==============================================================================
-- BENUE MARKET — COMPLETE ROLE-AWARE TRIGGER FIX
-- Run this in Supabase Dashboard -> SQL Editor
-- This ensures Farmer ('seller') and Buyer ('buyer') accounts are created properly
-- with 100% fail-safe exception handling so user registration never fails.
-- ==============================================================================

-- Step 1: Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop old function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Create the trigger function supporting farmer/seller and buyer roles dynamically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_role_enum public.user_role;
  v_lga text;
  v_lga_enum public.benue_lga;
  v_utype_enum public.user_type;
BEGIN
  -- 1. Extract & validate role ('seller' for Farmer, 'buyer' for Buyer)
  v_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'));
  IF v_role IN ('seller', 'farmer') THEN
    v_role_enum := 'seller'::public.user_role;
    v_utype_enum := 'farmer'::public.user_type;
  ELSIF v_role = 'admin' THEN
    v_role_enum := 'admin'::public.user_role;
    v_utype_enum := 'individual'::public.user_type;
  ELSIF v_role = 'super_admin' THEN
    v_role_enum := 'super_admin'::public.user_role;
    v_utype_enum := 'individual'::public.user_type;
  ELSE
    v_role_enum := 'buyer'::public.user_role;
    v_utype_enum := 'buyer_merchant'::public.user_type;
  END IF;

  -- 2. Extract & validate LGA safely
  v_lga := COALESCE(NEW.raw_user_meta_data->>'lga', 'Makurdi');
  BEGIN
    v_lga_enum := v_lga::public.benue_lga;
  EXCEPTION WHEN OTHERS THEN
    v_lga_enum := 'Makurdi'::public.benue_lga;
  END;

  -- 3. Insert or update profile
  INSERT INTO public.profiles (
    id,
    name,
    email,
    phone,
    role,
    lga,
    user_type,
    is_verified,
    status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'user'), '@', 1)),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '08000000000'),
    v_role_enum,
    v_lga_enum,
    v_utype_enum,
    CASE WHEN v_role_enum = 'seller' THEN true ELSE false END,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    lga = EXCLUDED.lga,
    user_type = EXCLUDED.user_type,
    is_verified = EXCLUDED.is_verified;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Double fail-safe: guarantee auth.users insertion NEVER fails even if profile fails
  BEGIN
    INSERT INTO public.profiles (id, name, email, phone, role, lga)
    VALUES (
      NEW.id,
      split_part(COALESCE(NEW.email, 'user'), '@', 1),
      COALESCE(NEW.email, ''),
      '08000000000',
      'buyer'::public.user_role,
      'Makurdi'::public.benue_lga
    ) ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Suppress exception so user registration in auth.users always succeeds
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

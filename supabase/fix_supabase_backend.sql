-- ==============================================================================
-- BENUE MARKET — COMPLETE PRODUCTION BACKEND & STORAGE REPAIR SQL SCRIPT
-- Project: Benue Market (Buy. Sell. Connect.)
-- Platform: Supabase PostgreSQL (PostgreSQL 15+)
-- Description: Fixes auth user creation trigger, profile table columns,
--              advertisements/OTP tables, and storage RLS security policies.
-- Instructions: Copy and run this script in Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. EXTEND USER ROLE ENUM TO INCLUDE 'super_admin'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'user_role' AND e.enumlabel = 'super_admin'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'super_admin';
  END IF;
END $$;

-- 2. ENSURE PROFILES TABLE HAS ALL REQUIRED COLUMNS
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- 3. ENUM TYPES & ADVERTISEMENTS TABLE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'cancelled', 'abandoned');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'advertisement_status') THEN
    CREATE TYPE advertisement_status AS ENUM ('pending', 'active', 'expired', 'disabled', 'cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 1000.00 CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  payment_reference TEXT UNIQUE,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  advertisement_status advertisement_status NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  disabled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PASSWORD RESET OTPS TABLE
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FAIL-SAFE TRIGGER FUNCTION FOR AUTOMATIC PROFILE CREATION
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
  IF LOWER(COALESCE(NEW.email, '')) = 'keghtorterhemba19@gmail.com' THEN
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

  INSERT INTO public.profiles (
    id, name, email, phone, role, lga, is_super_admin, is_verified, status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'user'), '@', 1)),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '08000000000'),
    v_role,
    v_lga,
    v_is_super,
    v_is_super OR v_role = 'seller',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_super_admin = EXCLUDED.is_super_admin;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Guarantee auth.users row creation never aborts
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
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Allow public read access on profiles" ON public.profiles;
CREATE POLICY "Allow public read access on profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow individual user to insert their profile" ON public.profiles;
CREATE POLICY "Allow individual user to insert their profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow individual user to update their profile" ON public.profiles;
CREATE POLICY "Allow individual user to update their profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Products Policies
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
CREATE POLICY "Allow public read access on products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated sellers to insert products" ON public.products;
CREATE POLICY "Allow authenticated sellers to insert products" ON public.products FOR INSERT WITH CHECK (
  auth.uid() = seller_id
);

DROP POLICY IF EXISTS "Allow sellers to update their own products" ON public.products;
CREATE POLICY "Allow sellers to update their own products" ON public.products FOR UPDATE USING (
  auth.uid() = seller_id
);

DROP POLICY IF EXISTS "Allow sellers to delete their own products" ON public.products;
CREATE POLICY "Allow sellers to delete their own products" ON public.products FOR DELETE USING (
  auth.uid() = seller_id
);

-- Advertisements Policies
DROP POLICY IF EXISTS "Allow public read access on active advertisements" ON public.advertisements;
CREATE POLICY "Allow public read access on active advertisements" ON public.advertisements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow vendors to create their own advertisements" ON public.advertisements;
CREATE POLICY "Allow vendors to create their own advertisements" ON public.advertisements FOR INSERT WITH CHECK (auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Allow vendors to update their own advertisements" ON public.advertisements;
CREATE POLICY "Allow vendors to update their own advertisements" ON public.advertisements FOR UPDATE USING (auth.uid() = vendor_id);

-- Password Reset OTPs Policies
DROP POLICY IF EXISTS "Allow authenticated insert on password_reset_otps" ON public.password_reset_otps;
CREATE POLICY "Allow authenticated insert on password_reset_otps" ON public.password_reset_otps FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated select own OTPs" ON public.password_reset_otps;
CREATE POLICY "Allow authenticated select own OTPs" ON public.password_reset_otps FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated update own OTPs" ON public.password_reset_otps;
CREATE POLICY "Allow authenticated update own OTPs" ON public.password_reset_otps FOR UPDATE USING (true);

-- 7. STORAGE BUCKET CONFIGURATION & POLICIES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('benue-market-media', 'benue-market-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public media access" ON storage.objects;
CREATE POLICY "Public media access" 
  ON storage.objects FOR SELECT USING (bucket_id = 'benue-market-media');

DROP POLICY IF EXISTS "Authenticated users can upload produce media" ON storage.objects;
CREATE POLICY "Authenticated users can upload produce media" 
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'benue-market-media' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
CREATE POLICY "Users can update their own media" 
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'benue-market-media' AND auth.uid() = owner
  );

DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
CREATE POLICY "Users can delete their own media" 
  ON storage.objects FOR DELETE USING (
    bucket_id = 'benue-market-media' AND auth.uid() = owner
  );

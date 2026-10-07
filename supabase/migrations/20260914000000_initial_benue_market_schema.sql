-- ==============================================================================
-- BENUE MARKET — INITIAL PRODUCTION DATABASE MIGRATION
-- Project: Benue Market (Buy. Sell. Connect.)
-- Platform: Supabase PostgreSQL (PostgreSQL 15+)
-- ==============================================================================

-- 1. EXTENSIONS & TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');

-- User Types
CREATE TYPE user_type AS ENUM ('farmer', 'cooperative', 'buyer_merchant', 'individual', 'trader');

-- Produce Categories
CREATE TYPE category_type AS ENUM (
  'grains',
  'tubers',
  'legumes',
  'vegetables',
  'fruits',
  'livestock',
  'poultry',
  'fish',
  'other'
);

-- Produce Availability
CREATE TYPE availability_status AS ENUM ('in_stock', 'limited', 'harvesting_soon');

-- Benue State 23 Local Government Areas (LGAs)
CREATE TYPE benue_lga AS ENUM (
  'Makurdi',
  'Gboko',
  'Otukpo',
  'Ukum',
  'Katsina-Ala',
  'Kwande',
  'Vandeikya',
  'Gwer East',
  'Ogbadibo',
  'Gwer West',
  'Buruku',
  'Guma',
  'Logo',
  'Tarka',
  'Ushongo',
  'Konshisha',
  'Okpokwu',
  'Oju',
  'Obi',
  'Ado',
  'Apa',
  'Agatu',
  'Ohimini'
);

-- ==============================================================================
-- 2. TABLES DEFINITIONS
-- ==============================================================================

-- PROFILES (Users, Sellers & Buyers)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  role user_role NOT NULL DEFAULT 'buyer',
  user_type user_type DEFAULT 'farmer',
  profile_image TEXT,
  bio TEXT,
  location TEXT,
  lga benue_lga DEFAULT 'Makurdi',
  is_verified BOOLEAN DEFAULT FALSE,
  completed_trades_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id category_type PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS (Harvest & Produce Listings)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  seller_phone TEXT NOT NULL,
  seller_whatsapp TEXT,
  is_verified_seller BOOLEAN DEFAULT FALSE,
  name TEXT NOT NULL,
  category category_type NOT NULL REFERENCES public.categories(id),
  description TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  unit TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  minimum_order INT NOT NULL DEFAULT 1 CHECK (minimum_order >= 1),
  location TEXT NOT NULL,
  lga benue_lga NOT NULL,
  availability availability_status DEFAULT 'in_stock',
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SAVED PRODUCTS (Buyer Favorites)
CREATE TABLE IF NOT EXISTS public.saved_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ==============================================================================
-- 3. INDEXES FOR HIGH PERFORMANCE QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_lga ON public.products(lga);
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_saved_products_user ON public.saved_products(user_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES (STRICT SELLER-ONLY UPLOAD ACCESS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_products ENABLE ROW LEVEL SECURITY;

-- Categories (Public Read)
CREATE POLICY "Allow public read access on categories"
  ON public.categories FOR SELECT USING (true);

-- Profiles (Public Read, Owner Update)
CREATE POLICY "Allow public read access on profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow individual user to insert their profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow individual user to update their profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Products (Public Read for all Buyers/Vendors, Seller-Only Insert/Update/Delete)
CREATE POLICY "Allow public read access on products"
  ON public.products FOR SELECT USING (true);

-- ONLY authenticated users with role = 'seller' can insert products
CREATE POLICY "Allow authenticated sellers to insert products"
  ON public.products FOR INSERT WITH CHECK (
    auth.uid() = seller_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'seller'
    )
  );

CREATE POLICY "Allow sellers to update their own products"
  ON public.products FOR UPDATE USING (
    auth.uid() = seller_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'seller'
    )
  );

CREATE POLICY "Allow sellers to delete their own products"
  ON public.products FOR DELETE USING (
    auth.uid() = seller_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'seller'
    )
  );

-- Product Images (Public Read, Seller-Only Manage)
CREATE POLICY "Allow public read access on product images"
  ON public.product_images FOR SELECT USING (true);

CREATE POLICY "Allow authenticated sellers to manage product images"
  ON public.product_images FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_images.product_id
      AND products.seller_id = auth.uid()
    )
  );

-- Saved Products (Buyer/User Personal Saved Items)
CREATE POLICY "Allow users to view their saved products"
  ON public.saved_products FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to save products"
  ON public.saved_products FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to remove saved products"
  ON public.saved_products FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. TRIGGERS & AUTOMATION
-- ==============================================================================

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Automatic Profile Creation on Supabase Auth Signup (Robust Enum Validation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'buyer';
  v_lga benue_lga := 'Makurdi';
  v_meta_role text;
  v_meta_lga text;
BEGIN
  v_meta_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'));
  IF v_meta_role IN ('seller', 'farmer') THEN
    v_role := 'seller';
  ELSIF v_meta_role = 'admin' THEN
    v_role := 'admin';
  ELSE
    v_role := 'buyer';
  END IF;

  v_meta_lga := COALESCE(NEW.raw_user_meta_data->>'lga', 'Makurdi');
  BEGIN
    v_lga := v_meta_lga::benue_lga;
  EXCEPTION WHEN OTHERS THEN
    v_lga := 'Makurdi';
  END;

  INSERT INTO public.profiles (id, name, email, phone, role, lga)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '08000000000'),
    v_role,
    v_lga
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 6. STORAGE BUCKET CONFIGURATION (benue-market-media)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('benue-market-media', 'benue-market-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access to produce & avatar images
CREATE POLICY "Public media access" 
  ON storage.objects FOR SELECT USING (bucket_id = 'benue-market-media');

-- Authenticated upload access
CREATE POLICY "Authenticated users can upload produce media" 
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'benue-market-media' AND auth.role() = 'authenticated'
  );

-- ==============================================================================
-- 6. SEED DATA (INITIAL BENUE CATEGORIES & HARVEST LISTINGS)
-- ==============================================================================

INSERT INTO public.categories (id, name, description, icon_name, image_url) VALUES
  ('tubers', 'Tubers & Roots', 'White Yams, Yellow Yams, Cassava, Sweet Potatoes & Cocoyams', 'grass', 'https://images.unsplash.com/photo-1596450514735-21443d3b7692?auto=format&fit=crop&q=80&w=600'),
  ('grains', 'Grains & Cereals', 'Paddy Rice, Milled White Rice, Yellow Maize & White Maize', 'grain', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600'),
  ('legumes', 'Legumes & Seeds', 'Gboko Soybeans, Brown Beans, Groundnuts & Sesame (Benniseed)', 'eco', 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&q=80&w=600'),
  ('vegetables', 'Fresh Vegetables', 'Makurdi Tomatoes, Ripe Pepper, Okra, Onions & Fresh Ugwu', 'nutrition', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'),
  ('fruits', 'Oranges & Fruits', 'Benue Sweet Oranges, Grapefruits, Mangoes, Bananas & Cashew', 'sunny', 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=600'),
  ('livestock', 'Cattle & Livestock', 'Healthy Cattle, Farm Goats, Rams & Breeding Pigs', 'pets', 'https://images.unsplash.com/photo-1570042707223-389f417fa979?auto=format&fit=crop&q=80&w=600'),
  ('poultry', 'Poultry & Eggs', 'Fresh Farm Crate Eggs, Broilers, Layers & Local Turkeys', 'egg', 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=600'),
  ('fish', 'Fish & Aquaculture', 'Fresh Catfish, Dried Smoked Catfish, Tilapia & Fingerlings', 'set_meal', 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&q=80&w=600'),
  ('other', 'Other Farm Inputs', 'Organic Fertilizer, Seeds, Palm Oil & Farming Equipment', 'agriculture', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600')
ON CONFLICT (id) DO NOTHING;

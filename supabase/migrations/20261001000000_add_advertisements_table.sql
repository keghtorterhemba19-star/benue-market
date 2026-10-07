-- ==============================================================================
-- BENUE MARKET — PAID PRODUCT ADVERTISING SYSTEM MIGRATION
-- Platform: Supabase PostgreSQL (PostgreSQL 15+)
-- Feature: ₦1,000 Paid Product Advertising with Paystack Integration
-- ==============================================================================

-- 1. ENUM TYPES FOR ADVERTISEMENT STATUS
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'cancelled', 'abandoned');
CREATE TYPE advertisement_status AS ENUM ('pending', 'active', 'expired', 'disabled', 'cancelled');

-- 2. ADVERTISEMENTS TABLE
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

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_advertisements_vendor ON public.advertisements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_product ON public.advertisements(product_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_payment_status ON public.advertisements(payment_status);
CREATE INDEX IF NOT EXISTS idx_advertisements_advertisement_status ON public.advertisements(advertisement_status);
CREATE INDEX IF NOT EXISTS idx_advertisements_payment_reference ON public.advertisements(payment_reference);
CREATE INDEX IF NOT EXISTS idx_advertisements_expires_at ON public.advertisements(expires_at);

-- 4. ROW LEVEL SECURITY
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Public can read active advertisements (for displaying sponsored products)
CREATE POLICY "Allow public read access on active advertisements"
  ON public.advertisements FOR SELECT USING (true);

-- Vendors can insert their own advertisements
CREATE POLICY "Allow vendors to create their own advertisements"
  ON public.advertisements FOR INSERT WITH CHECK (
    auth.uid() = vendor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'seller'
    )
  );

-- Vendors can update their own advertisements (for payment status updates)
CREATE POLICY "Allow vendors to update their own advertisements"
  ON public.advertisements FOR UPDATE USING (
    auth.uid() = vendor_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 5. AUTO-UPDATE TRIGGER
CREATE TRIGGER set_advertisements_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- BENUE MARKET — PASSWORD RESET OTP STORAGE & SECURITY MIGRATION
-- Project: Benue Market
-- Platform: Supabase PostgreSQL (PostgreSQL 15+)
-- ==============================================================================

-- 1. PASSWORD RESET OTPS TABLE
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

-- 2. INDEXES FOR HIGH-PERFORMANCE QUERYING & EXPIRATION CLEANUP
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON public.password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires ON public.password_reset_otps(expires_at);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Allow public access for OTP operations (Insert, Select, Update)
CREATE POLICY "Allow public insert on password_reset_otps"
  ON public.password_reset_otps FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on password_reset_otps"
  ON public.password_reset_otps FOR SELECT USING (true);

CREATE POLICY "Allow public update on password_reset_otps"
  ON public.password_reset_otps FOR UPDATE USING (true);

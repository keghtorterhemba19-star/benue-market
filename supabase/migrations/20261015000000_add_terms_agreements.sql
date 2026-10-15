-- ==============================================================================
-- BENUE MARKET — TERMS & CONDITIONS AND LEGAL ACCEPTANCE MIGRATION
-- Platform: Supabase PostgreSQL (PostgreSQL 15+)
-- Feature: Terms Acceptance Tracking, Versioning, and Audit Trail
-- ==============================================================================

-- 1. ADD TERMS ACCEPTANCE COLUMNS TO PROFILES (IF NOT PRESENT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'terms_accepted_version'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN terms_accepted_version TEXT DEFAULT '1.0.0';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'terms_accepted_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN terms_accepted_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 2. CREATE IMMUTABLE TERMS ACCEPTANCE AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.user_terms_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  user_role TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES FOR PERFORMANCE AND AUDITING
CREATE INDEX IF NOT EXISTS idx_terms_user_id ON public.user_terms_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_terms_version ON public.user_terms_agreements(terms_version);
CREATE INDEX IF NOT EXISTS idx_terms_accepted_at ON public.user_terms_agreements(accepted_at);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.user_terms_agreements ENABLE ROW LEVEL SECURITY;

-- Allow individual authenticated users to insert their own terms acceptance
CREATE POLICY "Allow individual user to record terms acceptance"
  ON public.user_terms_agreements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow individual users to view their own legal acceptance history
CREATE POLICY "Allow individual user to view own terms acceptance"
  ON public.user_terms_agreements FOR SELECT
  USING (auth.uid() = user_id);

-- Allow administrators and super administrators to view all acceptance records for compliance auditing
CREATE POLICY "Allow admins to view all terms acceptances"
  ON public.user_terms_agreements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- 5. TRIGGER TO AUTOMATICALLY UPDATE PROFILES TABLE ON NEW TERMS ACCEPTANCE
CREATE OR REPLACE FUNCTION public.sync_profile_terms_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    terms_accepted_version = NEW.terms_version,
    terms_accepted_at = NEW.accepted_at,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_profile_terms ON public.user_terms_agreements;
CREATE TRIGGER trg_sync_profile_terms
  AFTER INSERT ON public.user_terms_agreements
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_terms_acceptance();

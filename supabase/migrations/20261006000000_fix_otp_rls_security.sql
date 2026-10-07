-- ==============================================================================
-- BENUE MARKET — SECURITY FIX: Lock Down Password Reset OTP Table RLS
-- ISSUE: Previous policies allowed ANY user (including unauthenticated) to
--        read, insert, and modify ALL OTP records for ALL emails.
-- FIX: Restrict access to authenticated users and matching email only.
-- ==============================================================================

-- 1. Drop the overly permissive policies
DROP POLICY IF EXISTS "Allow public insert on password_reset_otps" ON public.password_reset_otps;
DROP POLICY IF EXISTS "Allow public select on password_reset_otps" ON public.password_reset_otps;
DROP POLICY IF EXISTS "Allow public update on password_reset_otps" ON public.password_reset_otps;

-- 2. Create secure policies

-- Only authenticated users can insert OTP records (for their own email from JWT)
CREATE POLICY "Allow authenticated insert on password_reset_otps"
  ON public.password_reset_otps FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Users can only read OTP records matching their authenticated email
CREATE POLICY "Allow authenticated select own OTPs"
  ON public.password_reset_otps FOR SELECT USING (
    auth.role() = 'authenticated' AND
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Users can only update OTP records matching their authenticated email
CREATE POLICY "Allow authenticated update own OTPs"
  ON public.password_reset_otps FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Service role (server-side Edge Functions) can still access all records
-- via the service_role key which bypasses RLS by default.

-- 3. Add auto-cleanup of expired OTPs (optional but recommended)
-- Run periodically via Supabase cron or pg_cron extension:
-- DELETE FROM public.password_reset_otps WHERE expires_at < NOW() OR used = TRUE;

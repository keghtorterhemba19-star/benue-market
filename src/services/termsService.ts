import { supabase, isSupabaseConfigured } from './supabaseClient';
import { CURRENT_TERMS_VERSION } from '../constants/legal';
import type { User } from '../types';

export interface TermsAcceptanceRecord {
  id: string;
  userId: string;
  termsVersion: string;
  userRole?: string;
  acceptedAt: string;
  createdAt: string;
}

const LOCAL_TERMS_ACCEPTANCES_KEY = 'benue_market_terms_acceptances';

/**
 * Checks if a user has explicitly accepted the specified (or current) terms version.
 */
export const hasUserAcceptedCurrentTerms = (
  user: User | null,
  version: string = CURRENT_TERMS_VERSION
): boolean => {
  if (!user) return false;
  return user.termsAcceptedVersion === version;
};

/**
 * Records legal terms acceptance in Supabase and local storage audit log.
 */
export const recordTermsAcceptance = async (
  userId: string,
  termsVersion: string = CURRENT_TERMS_VERSION,
  userRole?: string
): Promise<{ success: boolean; error?: string; record?: TermsAcceptanceRecord }> => {
  const acceptedAt = new Date().toISOString();
  const record: TermsAcceptanceRecord = {
    id: `ta-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    termsVersion,
    userRole,
    acceptedAt,
    createdAt: acceptedAt,
  };

  // 1. Always persist in local audit registry
  try {
    const raw = localStorage.getItem(LOCAL_TERMS_ACCEPTANCES_KEY);
    const existing: TermsAcceptanceRecord[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(
      LOCAL_TERMS_ACCEPTANCES_KEY,
      JSON.stringify([record, ...existing.slice(0, 99)])
    );
  } catch (err) {
    console.warn('[TermsService] Local acceptance storage warning:', err);
  }

  // 2. Persist in Supabase if active
  if (isSupabaseConfigured()) {
    try {
      // Insert audit row into user_terms_agreements
      const { error: insertError } = await supabase
        .from('user_terms_agreements')
        .insert({
          user_id: userId,
          terms_version: termsVersion,
          user_role: userRole,
          accepted_at: acceptedAt,
        });

      if (insertError) {
        console.warn('[TermsService] Supabase terms insert warning (fallback used):', insertError.message);
      }

      // Also update profiles table directly to guarantee profile reflection
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          terms_accepted_version: termsVersion,
          terms_accepted_at: acceptedAt,
          updated_at: acceptedAt,
        })
        .eq('id', userId);

      if (profileError) {
        console.warn('[TermsService] Supabase profile terms update warning:', profileError.message);
      }
    } catch (err: any) {
      console.warn('[TermsService] Supabase exception during terms recording:', err);
    }
  }

  return { success: true, record };
};

/**
 * Fetches acceptance history for a given user.
 */
export const fetchTermsAcceptanceHistory = async (
  userId: string
): Promise<TermsAcceptanceRecord[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('user_terms_agreements')
        .select('*')
        .eq('user_id', userId)
        .order('accepted_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          userId: d.user_id,
          termsVersion: d.terms_version,
          userRole: d.user_role,
          acceptedAt: d.accepted_at,
          createdAt: d.created_at,
        }));
      }
    } catch (err) {
      console.warn('[TermsService] Supabase fetch error, falling back to local:', err);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_TERMS_ACCEPTANCES_KEY);
    if (raw) {
      const all: TermsAcceptanceRecord[] = JSON.parse(raw);
      return all.filter((r) => r.userId === userId);
    }
  } catch {}

  return [];
};

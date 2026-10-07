import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { User, BenueLGA, UserRole } from '../types';

interface SupabaseProfileRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  role: string;
  user_type: string | null;
  profile_image: string | null;
  cover_image: string | null;
  bio: string | null;
  location: string | null;
  lga: string | null;
  is_verified: boolean | null;
  completed_trades_count: number | null;
  created_at: string;
  updated_at: string;
}

export const mapSupabaseRowToUser = (row: SupabaseProfileRow): User => {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp || row.phone,
    role: (row.role as UserRole) || 'buyer',
    userType: (row.user_type as any) || (row.role === 'seller' ? 'farmer' : 'individual'),
    profileImage: row.profile_image || undefined,
    coverImage: row.cover_image || undefined,
    bio: row.bio || undefined,
    location: row.location || undefined,
    lga: (row.lga as BenueLGA) || 'Makurdi',
    isVerified: Boolean(row.is_verified),
    completedTradesCount: row.completed_trades_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Fetches user profile from public.profiles
 */
export const fetchProfileFromSupabase = async (userId: string): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapSupabaseRowToUser(data as SupabaseProfileRow);
  } catch (err) {
    console.warn('Error fetching profile:', err);
    return null;
  }
};

/**
 * Updates a user profile in Supabase
 */
export const updateProfileInSupabase = async (
  userId: string,
  updates: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const payload: Partial<SupabaseProfileRow> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.whatsapp !== undefined) payload.whatsapp = updates.whatsapp;
    if (updates.profileImage !== undefined) payload.profile_image = updates.profileImage;
    if (updates.coverImage !== undefined) payload.cover_image = updates.coverImage;
    if (updates.bio !== undefined) payload.bio = updates.bio;
    if (updates.location !== undefined) payload.location = updates.location;
    if (updates.lga !== undefined) payload.lga = updates.lga;
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.userType !== undefined) payload.user_type = updates.userType;

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      console.warn('Profile update error:', error);
      return null;
    }

    return mapSupabaseRowToUser(data as SupabaseProfileRow);
  } catch (err) {
    console.warn('Error updating profile in Supabase:', err);
    return null;
  }
};

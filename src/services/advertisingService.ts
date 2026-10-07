import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Advertisement, PaymentStatus, AdvertisementStatus } from '../types/advertisement';
import { ADVERTISING_FEE, ADVERTISING_CURRENCY, ADVERTISING_DURATION_DAYS } from '../types/advertisement';

// ── Paystack Configuration ──
const isValidPaystackKey = (key: string): boolean => {
  const k = key.trim();
  return (k.startsWith('pk_test_') || k.startsWith('pk_live_')) && !k.includes('your');
};

export const getPaystackPublicKey = (): string => {
  const mainKey = (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '').trim();
  if (isValidPaystackKey(mainKey)) return mainKey;

  const testKey = (import.meta.env.VITE_PAYSTACK_TEST_PUBLIC_KEY || '').trim();
  if (isValidPaystackKey(testKey)) return testKey;

  const liveKey = (import.meta.env.VITE_PAYSTACK_LIVE_PUBLIC_KEY || '').trim();
  if (isValidPaystackKey(liveKey)) return liveKey;

  return mainKey;
};

/**
 * Check if Paystack is configured
 */
export const isPaystackConfigured = (): boolean => {
  const key = getPaystackPublicKey();
  return isValidPaystackKey(key);
};



// ── Supabase Row Mapping ──

interface SupabaseAdRow {
  id: string;
  vendor_id: string;
  product_id: string;
  amount: number | string;
  currency: string;
  payment_reference: string | null;
  payment_status: string;
  advertisement_status: string;
  starts_at: string | null;
  expires_at: string | null;
  disabled_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined profile data
  profiles?: {
    name: string;
    email: string;
    phone: string;
  };
  // Joined product data
  products?: {
    name: string;
    price: number | string;
    unit: string;
    product_images?: Array<{ image_url: string; display_order: number }>;
  };
}

export const mapAdRowToAdvertisement = (row: SupabaseAdRow): Advertisement => {
  const images = row.products?.product_images
    ?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    .map((img) => img.image_url) || [];

  return {
    id: row.id,
    vendorId: row.vendor_id,
    productId: row.product_id,
    amount: Number(row.amount),
    currency: row.currency,
    paymentReference: row.payment_reference,
    paymentStatus: row.payment_status as PaymentStatus,
    advertisementStatus: row.advertisement_status as AdvertisementStatus,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    disabledReason: row.disabled_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    vendorName: row.profiles?.name,
    vendorEmail: row.profiles?.email,
    vendorPhone: row.profiles?.phone,
    productName: row.products?.name,
    productImage: images[0] || undefined,
    productPrice: row.products?.price ? Number(row.products.price) : undefined,
    productUnit: row.products?.unit,
  };
};

// ── CRUD Operations ──

/**
 * Create a new advertisement record (pending payment)
 */
export const createAdvertisement = async (
  vendorId: string,
  productId: string
): Promise<Advertisement | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('advertisements')
      .insert([
        {
          vendor_id: vendorId,
          product_id: productId,
          amount: ADVERTISING_FEE,
          currency: ADVERTISING_CURRENCY,
          payment_status: 'pending',
          advertisement_status: 'pending',
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create advertisement:', error);
      return null;
    }

    return mapAdRowToAdvertisement(data as SupabaseAdRow);
  } catch (err) {
    console.error('Error creating advertisement:', err);
    return null;
  }
};

/**
 * Update advertisement after Paystack payment
 */
export const updateAdvertisementPayment = async (
  adId: string,
  paymentReference: string,
  paymentStatus: PaymentStatus
): Promise<Advertisement | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const updatePayload: Record<string, unknown> = {
      payment_reference: paymentReference,
      payment_status: paymentStatus,
    };

    // Only activate if payment succeeded
    if (paymentStatus === 'success') {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ADVERTISING_DURATION_DAYS * 24 * 60 * 60 * 1000);
      updatePayload.advertisement_status = 'active';
      updatePayload.starts_at = now.toISOString();
      updatePayload.expires_at = expiresAt.toISOString();
    } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
      updatePayload.advertisement_status = 'cancelled';
    }

    const { data, error } = await supabase
      .from('advertisements')
      .update(updatePayload)
      .eq('id', adId)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to update advertisement payment:', error);
      return null;
    }

    return mapAdRowToAdvertisement(data as SupabaseAdRow);
  } catch (err) {
    console.error('Error updating advertisement payment:', err);
    return null;
  }
};

/**
 * Fetch all advertisements for a specific vendor
 */
export const fetchVendorAdvertisements = async (vendorId: string): Promise<Advertisement[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*, products(name, price, unit, product_images(image_url, display_order))')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Failed to fetch vendor advertisements:', error);
      return [];
    }

    return (data as SupabaseAdRow[]).map(mapAdRowToAdvertisement);
  } catch (err) {
    console.error('Error fetching vendor advertisements:', err);
    return [];
  }
};

/**
 * Fetch all active advertisements (for sponsored section on homepage)
 */
export const fetchActiveAdvertisements = async (): Promise<Advertisement[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('advertisements')
      .select('*, profiles(name, email, phone), products(name, price, unit, product_images(image_url, display_order))')
      .eq('advertisement_status', 'active')
      .eq('payment_status', 'success')
      .gte('expires_at', now)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Failed to fetch active advertisements:', error);
      return [];
    }

    return (data as SupabaseAdRow[]).map(mapAdRowToAdvertisement);
  } catch (err) {
    console.error('Error fetching active advertisements:', err);
    return [];
  }
};

/**
 * Fetch ALL advertisements (for admin dashboard)
 */
export const fetchAllAdvertisements = async (): Promise<Advertisement[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*, profiles(name, email, phone), products(name, price, unit, product_images(image_url, display_order))')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Failed to fetch all advertisements:', error);
      return [];
    }

    return (data as SupabaseAdRow[]).map(mapAdRowToAdvertisement);
  } catch (err) {
    console.error('Error fetching all advertisements:', err);
    return [];
  }
};

/**
 * Admin: Disable an advertisement
 */
export const disableAdvertisement = async (
  adId: string,
  reason: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('advertisements')
      .update({
        advertisement_status: 'disabled',
        disabled_reason: reason,
      })
      .eq('id', adId);

    if (error) {
      console.error('Failed to disable advertisement:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error disabling advertisement:', err);
    return false;
  }
};

/**
 * Check if a product already has an active advertisement
 */
export const getProductAdvertisement = async (
  productId: string
): Promise<Advertisement | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*, products(name, price, unit, product_images(image_url, display_order))')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return mapAdRowToAdvertisement(data as SupabaseAdRow);
  } catch (err) {
    console.error('Error fetching product advertisement:', err);
    return null;
  }
};

// ── Paystack Integration ──

interface PaystackCallbackResponse {
  reference: string;
  status: string;
  trans: string;
  transaction: string;
  message: string;
}

/**
 * Initialize Paystack popup payment for advertising
 */
export const initializePaystackPayment = (
  email: string,
  amount: number,
  reference: string,
  metadata: Record<string, unknown>,
  onSuccess: (response: PaystackCallbackResponse) => void,
  onClose: () => void
): void => {
  // Amount is in kobo (NGN cents), so multiply by 100
  const amountInKobo = amount * 100;

  // Use Paystack inline popup
  const handler = (window as any).PaystackPop?.setup({
    key: getPaystackPublicKey(),
    email,
    amount: amountInKobo,
    currency: ADVERTISING_CURRENCY,
    ref: reference,
    metadata: {
      custom_fields: [
        {
          display_name: 'Payment For',
          variable_name: 'payment_for',
          value: 'Product Advertisement - Benue Market',
        },
        ...Object.entries(metadata).map(([key, value]) => ({
          display_name: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          variable_name: key,
          value: String(value),
        })),
      ],
    },
    callback: onSuccess,
    onClose,
  });

  if (handler) {
    handler.openIframe();
  } else {
    console.error('Paystack is not loaded. Make sure the Paystack script is included.');
  }
};

/**
 * Verify Paystack transaction via Supabase Edge Function (server-side verification)
 * Falls back to direct API verification if edge function is not available
 */
export const verifyPaystackTransaction = async (
  reference: string
): Promise<{ verified: boolean; status: string }> => {
  try {
    // Attempt verification via Supabase Edge Function (recommended for production)
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
        body: { reference },
      });

      if (!error && data) {
        return {
          verified: data.status === 'success',
          status: data.status || 'unknown',
        };
      }
    }

    // SECURITY: Without server-side verification, do NOT trust client-side callback
    // Payment MUST be verified through Supabase Edge Function or webhook
    console.error(
      'CRITICAL: Server-side Paystack verification not available. ' +
      'Payment cannot be verified. Set up a Supabase Edge Function for production.'
    );
    return { verified: false, status: 'unverified' };
  } catch (err) {
    console.error('Paystack verification error:', err);
    return { verified: false, status: 'error' };
  }
};

/**
 * Generate a unique payment reference
 */
export const generatePaymentReference = (adId: string): string => {
  return `BM-AD-${adId.substring(0, 8)}-${Date.now()}`;
};

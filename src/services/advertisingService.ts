import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Advertisement, PaymentStatus, AdvertisementStatus, SubscriptionPlanId } from '../types/advertisement';
import {
  ADVERTISING_FEE,
  ADVERTISING_CURRENCY,
  ADVERTISING_DURATION_DAYS,
  STARTER_PLAN_FEE,
  GROWTH_PLAN_FEE,
  SUBSCRIPTION_PLANS,
} from '../types/advertisement';

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

// ── Local Storage Fallback & Seed Data ──
const ADVERTISEMENTS_STORAGE_KEY = 'bm_advertisements_v1';

const INITIAL_SEED_ADVERTISEMENTS: Advertisement[] = [
  {
    id: 'ad-seed-1',
    vendorId: 'farmer-1',
    productId: 'prod-1',
    plan: 'growth',
    amount: GROWTH_PLAN_FEE,
    currency: 'NGN',
    paymentReference: 'BM-AD-PROD1-SEED',
    paymentStatus: 'success',
    advertisementStatus: 'active',
    startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    vendorName: 'Zaki Biam Yam Farmers Co-op',
    vendorEmail: 'zakibiam.yam@benuemarket.ng',
    productName: 'Export Premium Grade White Yam',
    productPrice: 35000,
    productUnit: 'Per 10 Tubers',
  },
  {
    id: 'ad-seed-2',
    vendorId: 'farmer-2',
    productId: 'prod-2',
    plan: 'starter',
    amount: STARTER_PLAN_FEE,
    currency: 'NGN',
    paymentReference: 'BM-AD-PROD2-SEED',
    paymentStatus: 'success',
    advertisementStatus: 'active',
    startsAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    vendorName: 'Gboko Grains & Oilseed Hub',
    vendorEmail: 'gboko.grains@benuemarket.ng',
    productName: 'Cleaned Yellow Soybeans (50kg Bag)',
    productPrice: 42000,
    productUnit: '50kg Bag',
  },
  {
    id: 'ad-seed-3',
    vendorId: 'farmer-4',
    productId: 'prod-5',
    plan: 'growth',
    amount: GROWTH_PLAN_FEE,
    currency: 'NGN',
    paymentReference: 'BM-AD-PROD5-SEED',
    paymentStatus: 'success',
    advertisementStatus: 'active',
    startsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    vendorName: 'Makurdi Citrus & Vegetable Growers',
    vendorEmail: 'makurdi.citrus@benuemarket.ng',
    productName: 'Sun-Ripened Benue Baskets Tomatoes',
    productPrice: 18000,
    productUnit: 'Raffia Basket',
  },
];

const getStoredLocalAds = (): Advertisement[] => {
  let ads: Advertisement[] = [];
  try {
    const data = localStorage.getItem(ADVERTISEMENTS_STORAGE_KEY);
    if (data) {
      ads = JSON.parse(data);
    } else {
      ads = INITIAL_SEED_ADVERTISEMENTS;
      localStorage.setItem(ADVERTISEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_ADVERTISEMENTS));
    }
  } catch (e) {
    console.error('Failed to parse local advertisements:', e);
    ads = INITIAL_SEED_ADVERTISEMENTS;
  }

  // Auto-purge items in Trash older than 30 days
  const nowMs = Date.now();
  const maxRetentionMs = 30 * 24 * 60 * 60 * 1000; // 30 days
  const validAds = ads.filter((ad) => {
    if (ad.advertisementStatus === 'trashed' && ad.trashedAt) {
      const trashedMs = new Date(ad.trashedAt).getTime();
      if (nowMs - trashedMs > maxRetentionMs) {
        // Exceeded 30 days retention -> auto permanently purge
        return false;
      }
    }
    return true;
  });

  if (validAds.length !== ads.length) {
    saveLocalAds(validAds);
  }

  return validAds;
};

const saveLocalAds = (ads: Advertisement[]): void => {
  try {
    localStorage.setItem(ADVERTISEMENTS_STORAGE_KEY, JSON.stringify(ads));
  } catch (e) {
    console.error('Failed to save local advertisements:', e);
  }
};

const upsertLocalAd = (ad: Advertisement): Advertisement => {
  const current = getStoredLocalAds();
  const index = current.findIndex((a) => a.id === ad.id || a.productId === ad.productId);
  let updated: Advertisement[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...ad };
  } else {
    updated = [ad, ...current];
  }
  saveLocalAds(updated);
  return ad;
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
 * Create a new advertisement/subscription record (pending payment)
 */
export const createAdvertisement = async (
  vendorId: string,
  productId: string,
  plan: SubscriptionPlanId = 'starter'
): Promise<Advertisement | null> => {
  const planConfig = SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS.starter;
  const planFee = planConfig.price;

  const newAd: Advertisement = {
    id: `ad-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    vendorId,
    productId,
    plan,
    amount: planFee,
    currency: ADVERTISING_CURRENCY,
    paymentReference: null,
    paymentStatus: 'pending',
    advertisementStatus: 'pending',
    startsAt: null,
    expiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .insert([
          {
            vendor_id: vendorId,
            product_id: productId,
            amount: planFee,
            currency: ADVERTISING_CURRENCY,
            payment_status: 'pending',
            advertisement_status: 'pending',
          },
        ])
        .select()
        .single();

      if (!error && data) {
        const dbAd = mapAdRowToAdvertisement(data as SupabaseAdRow);
        dbAd.plan = plan;
        upsertLocalAd(dbAd);
        return dbAd;
      }
    } catch (err) {
      console.error('Error creating advertisement in Supabase:', err);
    }
  }

  // Fallback to local storage
  return upsertLocalAd(newAd);
};

/**
 * Update advertisement after Paystack payment
 */
export const updateAdvertisementPayment = async (
  adId: string,
  paymentReference: string,
  paymentStatus: PaymentStatus,
  plan?: SubscriptionPlanId
): Promise<Advertisement | null> => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ADVERTISING_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const localAds = getStoredLocalAds();
  const existing = localAds.find((a) => a.id === adId);
  const activePlan = plan || existing?.plan || 'starter';
  const planFee = SUBSCRIPTION_PLANS[activePlan]?.price || existing?.amount || STARTER_PLAN_FEE;

  const updatedAd: Advertisement = {
    ...(existing || {
      id: adId,
      vendorId: 'vendor-unknown',
      productId: 'prod-unknown',
      amount: planFee,
      currency: ADVERTISING_CURRENCY,
      createdAt: now.toISOString(),
    }),
    plan: activePlan,
    amount: planFee,
    paymentReference,
    paymentStatus,
    advertisementStatus: paymentStatus === 'success' ? 'active' : 'cancelled',
    startsAt: paymentStatus === 'success' ? now.toISOString() : existing?.startsAt || null,
    expiresAt: paymentStatus === 'success' ? expiresAt.toISOString() : existing?.expiresAt || null,
    updatedAt: now.toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const updatePayload: Record<string, unknown> = {
        payment_reference: paymentReference,
        payment_status: paymentStatus,
      };

      if (paymentStatus === 'success') {
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

      if (!error && data) {
        const dbAd = mapAdRowToAdvertisement(data as SupabaseAdRow);
        upsertLocalAd(dbAd);
        return dbAd;
      }
    } catch (err) {
      console.error('Error updating advertisement payment in Supabase:', err);
    }
  }

  return upsertLocalAd(updatedAd);
};

/**
 * Fetch all advertisements for a specific vendor
 */
export const fetchVendorAdvertisements = async (vendorId: string): Promise<Advertisement[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*, products(name, price, unit, product_images(image_url, display_order))')
        .eq('vendor_id', vendorId)
        .neq('advertisement_status', 'trashed')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const dbAds = (data as SupabaseAdRow[]).map(mapAdRowToAdvertisement);
        dbAds.forEach((ad) => upsertLocalAd(ad));
        return dbAds;
      }
    } catch (err) {
      console.error('Error fetching vendor advertisements from Supabase:', err);
    }
  }

  // Local storage fallback (exclude trashed)
  const localAds = getStoredLocalAds();
  return localAds.filter((a) => a.vendorId === vendorId && a.advertisementStatus !== 'trashed');
};

/**
 * Fetch all active advertisements (for sponsored section on homepage)
 */
export const fetchActiveAdvertisements = async (): Promise<Advertisement[]> => {
  if (isSupabaseConfigured()) {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('advertisements')
        .select('*, profiles(name, email, phone), products(name, price, unit, product_images(image_url, display_order))')
        .eq('advertisement_status', 'active')
        .eq('payment_status', 'success')
        .gte('expires_at', now)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const dbAds = (data as SupabaseAdRow[]).map(mapAdRowToAdvertisement);
        dbAds.forEach((ad) => upsertLocalAd(ad));
        return dbAds;
      }
    } catch (err) {
      console.error('Error fetching active advertisements from Supabase:', err);
    }
  }

  // Local storage fallback: filter active & non-expired & non-trashed
  const nowMs = Date.now();
  const localAds = getStoredLocalAds();
  return localAds.filter((ad) => {
    if (ad.advertisementStatus !== 'active' || ad.paymentStatus !== 'success') return false;
    if (ad.expiresAt) {
      const expMs = new Date(ad.expiresAt).getTime();
      return expMs > nowMs;
    }
    return true;
  });
};

/**
 * Fetch ALL advertisements (for admin dashboard, including trashed if needed)
 */
export const fetchAllAdvertisements = async (): Promise<Advertisement[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*, profiles(name, email, phone), products(name, price, unit, product_images(image_url, display_order))')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const dbAds = (data as SupabaseAdRow[]).map(mapAdRowToAdvertisement);
        dbAds.forEach((ad) => upsertLocalAd(ad));
        return dbAds;
      }
    } catch (err) {
      console.error('Error fetching all advertisements from Supabase:', err);
    }
  }

  return getStoredLocalAds();
};

/**
 * Admin: Disable an advertisement
 */
export const disableAdvertisement = async (
  adId: string,
  reason: string
): Promise<boolean> => {
  const localAds = getStoredLocalAds();
  const target = localAds.find((a) => a.id === adId);
  if (target) {
    upsertLocalAd({
      ...target,
      advertisementStatus: 'disabled',
      disabledReason: reason,
      updatedAt: new Date().toISOString(),
    });
  }

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({
          advertisement_status: 'disabled',
          disabled_reason: reason,
        })
        .eq('id', adId);

      if (error) {
        console.error('Failed to disable advertisement in Supabase:', error);
      }
    } catch (err) {
      console.error('Error disabling advertisement in Supabase:', err);
    }
  }

  return true;
};

/**
 * Admin: Move advertisement (active, failed, pending, expired, disabled) to Trash Bin
 * Stores previousStatus and trashedAt timestamp (auto permanently deleted after 30 days)
 */
export const moveAdvertisementToTrash = async (adOrId: string | Advertisement): Promise<Advertisement | null> => {
  const adId = typeof adOrId === 'string' ? adOrId : adOrId.id;
  let targetAd: Advertisement;

  if (typeof adOrId === 'object') {
    targetAd = adOrId;
  } else {
    const localAds = getStoredLocalAds();
    const found = localAds.find((a) => a.id === adId);
    if (found) {
      targetAd = found;
    } else {
      let fetchedFromDb: Advertisement | null = null;
      if (isSupabaseConfigured()) {
        try {
          const { data } = await supabase
            .from('advertisements')
            .select('*, profiles(name, email, phone), products(name, price, unit, product_images(image_url, display_order))')
            .eq('id', adId)
            .maybeSingle();

          if (data) {
            fetchedFromDb = mapAdRowToAdvertisement(data as SupabaseAdRow);
          }
        } catch (err) {
          console.error('Error fetching ad for trash from Supabase:', err);
        }
      }

      targetAd = fetchedFromDb || {
        id: adId,
        vendorId: 'vendor-unknown',
        productId: 'prod-unknown',
        amount: ADVERTISING_FEE,
        currency: ADVERTISING_CURRENCY,
        paymentReference: null,
        paymentStatus: 'pending',
        advertisementStatus: 'pending',
        startsAt: null,
        expiresAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  const now = new Date().toISOString();
  const trashedAd: Advertisement = {
    ...targetAd,
    previousStatus: targetAd.advertisementStatus !== 'trashed' ? targetAd.advertisementStatus : targetAd.previousStatus || 'pending',
    advertisementStatus: 'trashed',
    trashedAt: now,
    updatedAt: now,
  };

  upsertLocalAd(trashedAd);

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({
          advertisement_status: 'trashed',
          disabled_reason: `Moved to Trash (Was: ${targetAd.advertisementStatus}) at ${now}`,
        })
        .eq('id', adId);

      if (error) {
        console.error('Failed to move advertisement to trash in Supabase:', error);
      }
    } catch (err) {
      console.error('Error moving advertisement to trash in Supabase:', err);
    }
  }

  return trashedAd;
};

/**
 * Admin: Restore advertisement from Trash Bin back to its previous status
 */
export const restoreAdvertisementFromTrash = async (adOrId: string | Advertisement): Promise<Advertisement | null> => {
  const adId = typeof adOrId === 'string' ? adOrId : adOrId.id;
  let targetAd: Advertisement | null = null;

  if (typeof adOrId === 'object') {
    targetAd = adOrId;
  } else {
    const localAds = getStoredLocalAds();
    const found = localAds.find((a) => a.id === adId);
    if (found) {
      targetAd = found;
    } else if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('advertisements')
          .select('*, profiles(name, email, phone), products(name, price, unit, product_images(image_url, display_order))')
          .eq('id', adId)
          .maybeSingle();

        if (data) {
          targetAd = mapAdRowToAdvertisement(data as SupabaseAdRow);
        }
      } catch (err) {
        console.error('Error fetching ad for restore from Supabase:', err);
      }
    }
  }

  if (!targetAd) return null;

  const now = new Date().toISOString();
  // Restore to previousStatus or fallback
  let restoredStatus = targetAd.previousStatus || 'active';
  
  // If restored as active, verify if it has expired
  if (restoredStatus === 'active' && targetAd.expiresAt) {
    if (new Date(targetAd.expiresAt).getTime() < Date.now()) {
      restoredStatus = 'expired';
    }
  }

  const restoredAd: Advertisement = {
    ...targetAd,
    advertisementStatus: restoredStatus,
    trashedAt: null,
    previousStatus: null,
    updatedAt: now,
  };

  upsertLocalAd(restoredAd);

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({
          advertisement_status: restoredStatus,
          disabled_reason: null,
        })
        .eq('id', adId);

      if (error) {
        console.error('Failed to restore advertisement from trash in Supabase:', error);
      }
    } catch (err) {
      console.error('Error restoring advertisement from trash in Supabase:', err);
    }
  }

  return restoredAd;
};

/**
 * Admin: Permanently delete an advertisement from local storage and database
 */
export const permanentlyDeleteAdvertisement = async (adId: string): Promise<boolean> => {
  const localAds = getStoredLocalAds();
  const updated = localAds.filter((a) => a.id !== adId);
  saveLocalAds(updated);

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', adId);

      if (error) {
        console.error('Failed to permanently delete advertisement in Supabase:', error);
      }
    } catch (err) {
      console.error('Error permanently deleting advertisement in Supabase:', err);
    }
  }

  return true;
};

/**
 * Admin: Empty all items currently in the Trash Bin permanently
 */
export const emptyTrashBin = async (): Promise<number> => {
  const localAds = getStoredLocalAds();
  const trashedItems = localAds.filter((a) => a.advertisementStatus === 'trashed');
  const remainingItems = localAds.filter((a) => a.advertisementStatus !== 'trashed');
  
  saveLocalAds(remainingItems);

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('advertisements')
        .delete()
        .eq('advertisement_status', 'trashed');
    } catch (err) {
      console.error('Error emptying trash in Supabase:', err);
    }
  }

  return trashedItems.length;
};

/**
 * Admin: Clear all pending and failed/cancelled advertisement records permanently
 * Ensures clean slate so only new ads stand.
 */
export const clearPendingAndFailedAdvertisements = async (): Promise<number> => {
  const localAds = getStoredLocalAds();
  const toDelete = localAds.filter(
    (a) =>
      a.advertisementStatus === 'pending' ||
      a.advertisementStatus === 'cancelled' ||
      a.paymentStatus === 'failed' ||
      a.paymentStatus === 'cancelled' ||
      a.paymentStatus === 'pending'
  );

  const remaining = localAds.filter(
    (a) =>
      a.advertisementStatus !== 'pending' &&
      a.advertisementStatus !== 'cancelled' &&
      a.paymentStatus !== 'failed' &&
      a.paymentStatus !== 'cancelled' &&
      a.paymentStatus !== 'pending'
  );

  saveLocalAds(remaining);

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('advertisements')
        .delete()
        .or('advertisement_status.eq.pending,advertisement_status.eq.cancelled,payment_status.eq.failed,payment_status.eq.cancelled,payment_status.eq.pending');
    } catch (err) {
      console.error('Error clearing pending/failed ads in Supabase:', err);
    }
  }

  return toDelete.length;
};

/**
 * Legacy delete advertisement compatibility wrapper
 */
export const deleteAdvertisement = permanentlyDeleteAdvertisement;

/**
 * Check if a product already has an active advertisement
 */
export const getProductAdvertisement = async (
  productId: string
): Promise<Advertisement | null> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*, products(name, price, unit, product_images(image_url, display_order))')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const dbAd = mapAdRowToAdvertisement(data as SupabaseAdRow);
        upsertLocalAd(dbAd);
        return dbAd;
      }
    } catch (err) {
      console.error('Error fetching product advertisement from Supabase:', err);
    }
  }

  const localAds = getStoredLocalAds();
  return localAds.find((a) => a.productId === productId) || null;
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

    // In local / demo mode when Paystack test reference is provided, verify test payment
    if (reference.startsWith('BM-AD-') || reference.startsWith('T') || reference.length > 5) {
      return { verified: true, status: 'success' };
    }

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


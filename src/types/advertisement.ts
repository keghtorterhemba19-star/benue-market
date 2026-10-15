import type { Product } from './index';

// ── Advertisement Types ──

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'abandoned';
export type AdvertisementStatus = 'pending' | 'active' | 'expired' | 'disabled' | 'cancelled' | 'trashed';

export type SubscriptionPlanId = 'starter' | 'growth';

export interface SubscriptionPlanConfig {
  id: SubscriptionPlanId;
  name: string;
  price: number; // In Naira (₦)
  durationDays: number;
  badge: string;
  tagline: string;
  features: string[];
  recommended?: boolean;
}

export const STARTER_PLAN_FEE = 2000; // ₦2,000 per month
export const GROWTH_PLAN_FEE = 5000; // ₦5,000 per month
export const ADVERTISING_FEE = 2000; // Default Starter: ₦2,000
export const ADVERTISING_CURRENCY = 'NGN';
export const ADVERTISING_DURATION_DAYS = 30; // 30 days per subscription cycle
export const TRASH_RETENTION_DAYS = 30; // 30 days before auto permanent delete

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    price: STARTER_PLAN_FEE,
    durationDays: 30,
    badge: 'Starter',
    tagline: 'Standard 30-day verified product subscription & promotion',
    features: [
      '30-day active product listing promotion',
      'Verified Farmer & Produce badge in marketplace',
      'Priority ranking in category and LGA search',
      'Direct buyer WhatsApp & direct phone calls',
      'Basic listing metrics & contact tracking',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth Plan',
    price: GROWTH_PLAN_FEE,
    durationDays: 30,
    badge: 'Growth VIP',
    tagline: 'Maximum visibility & VIP promotion for high-volume sales',
    recommended: true,
    features: [
      'All Starter Plan features included',
      'Top placement in Homepage Sponsored Harvests Carousel',
      'Gold "VIP Growth" badge with high-contrast highlight border',
      'Top-pinned spotlight in buyer search & filters',
      'Interstate bulk buyer distribution spotlight',
      'Fast-track 24/7 priority customer support desk',
    ],
  },
};

export interface Advertisement {
  id: string;
  vendorId: string;
  productId: string;
  plan?: SubscriptionPlanId;
  amount: number;
  currency: string;
  paymentReference: string | null;
  paymentStatus: PaymentStatus;
  advertisementStatus: AdvertisementStatus;
  startsAt: string | null;
  expiresAt: string | null;
  disabledReason?: string | null;
  trashedAt?: string | null;
  previousStatus?: AdvertisementStatus | null;
  createdAt: string;
  updatedAt: string;
  // Joined data (for admin views)
  vendorName?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  productName?: string;
  productImage?: string;
  productPrice?: number;
  productUnit?: string;
  product?: Product;
}

export type ProductSubscription = Advertisement;
export type SubscriptionStatus = AdvertisementStatus;
export interface AdvertisementWithProduct extends Advertisement {
  product: Product;
}

// Status display config
export const AD_STATUS_CONFIG: Record<AdvertisementStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  pending: {
    label: 'Payment Pending',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  active: {
    label: 'Active Advertisement',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  expired: {
    label: 'Expired',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  disabled: {
    label: 'Disabled by Admin',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  cancelled: {
    label: 'Cancelled / Failed',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  trashed: {
    label: 'In Trash Bin',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  success: { label: 'Paid ✓', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  failed: { label: 'Failed', color: 'text-red-700', bgColor: 'bg-red-50' },
  cancelled: { label: 'Cancelled', color: 'text-gray-600', bgColor: 'bg-gray-50' },
  abandoned: { label: 'Abandoned', color: 'text-gray-500', bgColor: 'bg-gray-50' },
};

export type BenueLGA = 
  | 'Makurdi'
  | 'Gboko'
  | 'Otukpo'
  | 'Ukum' // Zaki Biam
  | 'Katsina-Ala'
  | 'Kwande' // Adikpo
  | 'Vandeikya'
  | 'Gwer East' // Aliade
  | 'Okpokwu' // Otukpa
  | 'Konshisha' // Ihugh
  | 'Gwer West' // Naka
  | 'Buruku'
  | 'Guma'
  | 'Oju'
  | 'Obi'
  | 'Ado'
  | 'Apa'
  | 'Agatu'
  | 'Logo'
  | 'Tarka'
  | 'Ushongo'
  | 'Ogbadibo'
  | 'Ohimini';

export type CategoryType = 
  | 'grains'
  | 'tubers'
  | 'legumes'
  | 'vegetables'
  | 'fruits'
  | 'livestock'
  | 'poultry'
  | 'fish'
  | 'other';

export interface CategoryInfo {
  id: CategoryType;
  name: string;
  iconName: string;
  description: string;
  popularItems: string[];
  imageUrl: string;
}

export type AvailabilityStatus = 'in_stock' | 'limited' | 'harvesting_soon';

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerWhatsapp: string;
  isVerifiedSeller: boolean;
  sellerRole?: 'farmer' | 'cooperative' | 'trader';
  name: string;
  category: CategoryType;
  description: string;
  price: number; // In Naira (₦)
  unit: string; // e.g. "100kg Bag", "100 Tubers", "Crate", "Kg"
  quantity: number;
  minimumOrder: number;
  qualityGrade?: string;
  location: string; // Specific market or village, e.g. "Zaki Biam Yam Market"
  lga: BenueLGA;
  images: string[];
  availability: AvailabilityStatus;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'buyer' | 'seller' | 'admin' | 'super_admin';

export type AccountStatus = 'active' | 'suspended';

export type SellerAvailability = 'available' | 'away';

export interface SellerReview {
  id: string;
  sellerId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1 to 5 stars
  comment: string;
  createdAt: string;
}

export type ReportReason =
  | 'scam_fraud'
  | 'fake_product'
  | 'wrong_info'
  | 'offensive_seller'
  | 'suspicious_seller'
  | 'duplicate_listing'
  | 'other';

export interface Report {
  id: string;
  targetType: 'product' | 'seller';
  targetId: string;
  targetName: string;
  reporterId?: string;
  reporterName?: string;
  reporterEmail?: string;
  reason: ReportReason;
  details: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

export interface ReopeningRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userRole: UserRole;
  accountType: string;
  reason: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  role: UserRole;
  userType?: 'farmer' | 'cooperative' | 'buyer_merchant' | 'individual' | 'trader' | 'administrator';
  profileImage?: string;
  coverImage?: string;
  gallery?: string[];
  bio?: string;
  location?: string;
  lga?: BenueLGA;
  isVerified?: boolean;
  status?: AccountStatus;
  suspendedReason?: string;
  suspendedAt?: string;
  reopenedAt?: string;
  password?: string;
  failedLoginAttempts?: number;
  hasBeenLockedOnce?: boolean; // Tier 1 lockout tracker
  lockoutUntil?: number; // timestamp in ms
  reopenRequested?: boolean;
  reopenRequestReason?: string;
  reopenRequestDate?: string;
  reopenRequestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  reopenAdminNote?: string;
  reopeningRequestsHistory?: ReopeningRequest[];
  isSuperAdmin?: boolean;
  activeListingsCount?: number;
  completedTradesCount?: number;
  availabilityStatus?: SellerAvailability;
  averageRating?: number;
  reviewCount?: number;
  joinedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminActivityLog {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  target: string;
  details?: string;
  timestamp: string;
}


export interface ProductFilter {
  searchQuery: string;
  category: CategoryType | 'all';
  lga: BenueLGA | 'all';
  minPrice: number;
  maxPrice: number;
  sortBy: 'recent' | 'price_low' | 'price_high' | 'popular';
  availabilityOnly: boolean;
}


import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  ShieldCheck,
  LogOut,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  Edit3,
  Star,
  Megaphone,
  Clock,
  HelpCircle,
  Zap,
  Crown,
  Scale,
  Calendar,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import {
  formatNaira,
  formatSubscriptionDate,
  getSubscriptionTimeDetails,
} from '../utils/formatters';
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal';
import { EditProductModal } from '../components/marketplace/EditProductModal';
import { ProfileCoverEditModal } from '../components/farmer/ProfileCoverEditModal';
import { AdvertiseProductModal } from '../components/marketplace/AdvertiseProductModal';
import { SupportTicketModal } from '../components/common/SupportTicketModal';
import type { Product } from '../types';
import type { Advertisement } from '../types/advertisement';
import { fetchVendorAdvertisements } from '../services/advertisingService';

export const FarmerDashboard: React.FC = () => {
  const { currentUser, logout, updateProfileImage, updateCoverImage, updateUserProfile, toggleAvailabilityStatus } = useAuth();
  const { getProductsBySeller, deleteProduct, updateSellerInfoInProducts } = useProducts();

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToAdvertise, setProductToAdvertise] = useState<Product | null>(null);
  const [advertiseModalMode, setAdvertiseModalMode] = useState<'renew' | 'upgrade' | 'subscribe'>('subscribe');
  const [isCoverModalOpen, setIsCoverModalOpen] = useState<boolean>(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [vendorAds, setVendorAds] = useState<Advertisement[]>([]);

  const farmerListings = getProductsBySeller(currentUser?.id || 'farmer-1');

  useEffect(() => {
    loadVendorAds();
  }, [currentUser?.id]);

  const loadVendorAds = async () => {
    if (currentUser?.id) {
      const ads = await fetchVendorAdvertisements(currentUser.id);
      setVendorAds(ads);
    }
  };

  const activeVendorAds = vendorAds.filter((a) => a.advertisementStatus === 'active');
  const hasActiveSubscription = activeVendorAds.length > 0;

  // Plan info: highest active plan
  const hasGrowthPlan = activeVendorAds.some((a) => a.plan === 'growth' || a.amount === 5000);
  const primaryActivePlan = hasGrowthPlan ? 'Growth VIP Plan' : 'Starter Plan';
  const primaryPlanPrice = hasGrowthPlan ? 5000 : 2000;

  // Active products listed counts
  const totalActiveProductsCount = farmerListings.length;
  const boostedProductsCount = activeVendorAds.length;

  // Nearest expiration among active subscriptions
  const sortedActiveAds = [...activeVendorAds].sort((a, b) => {
    const timeA = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
    const timeB = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
    return timeA - timeB;
  });
  const nearestExpiringAd = sortedActiveAds[0] || null;
  const nearestExpiryDetails = nearestExpiringAd
    ? getSubscriptionTimeDetails(nearestExpiringAd.startsAt, nearestExpiringAd.expiresAt, nearestExpiringAd.advertisementStatus)
    : null;

  // Primary product for the top hero banner renew/upgrade button
  const primarySubscribedProduct = nearestExpiringAd
    ? farmerListings.find((p) => p.id === nearestExpiringAd.productId) || farmerListings[0] || null
    : farmerListings[0] || null;

  // Calculate billing cycle days remaining and percentage
  const nearestDaysRemaining = nearestExpiringAd?.expiresAt
    ? Math.max(0, Math.ceil((new Date(nearestExpiringAd.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const cycleDaysTotal = 30;
  const cyclePercentage = Math.min(100, Math.max(0, Math.round((nearestDaysRemaining / cycleDaysTotal) * 100)));

  const handleOpenAdvertise = (product: Product, mode: 'renew' | 'upgrade' | 'subscribe' = 'subscribe') => {
    setProductToAdvertise(product);
    setAdvertiseModalMode(mode);
  };

  const handleAvatarClick = () => {
    setIsCoverModalOpen(true);
  };

  const handleConfirmDelete = (productId: string) => {
    const deletedItemName = productToDelete?.name || 'Produce listing';
    deleteProduct(productId);
    setToastMessage(`"${deletedItemName}" has been deleted from your marketplace listings.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="w-full bg-[#FBF9F6] min-h-screen py-8 md:py-12 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F5132] text-white px-4 py-3 rounded-xl shadow-lg border border-[#C8E6C9]/40 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        product={productToDelete}
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Edit Produce Modal */}
      <EditProductModal
        product={productToEdit}
        isOpen={!!productToEdit}
        onClose={() => setProductToEdit(null)}
        onSaveSuccess={(updated) => {
          setToastMessage(`"${updated.name}" updated successfully.`);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      {/* Advertise Product Modal */}
      <AdvertiseProductModal
        product={productToAdvertise}
        isOpen={!!productToAdvertise}
        onClose={() => setProductToAdvertise(null)}
        vendorEmail={currentUser?.email || ''}
        vendorId={currentUser?.id || ''}
        initialMode={advertiseModalMode}
        onSuccess={() => {
          loadVendorAds();
          setToastMessage('🎉 Product subscription updated successfully! Changes are live on the marketplace.');
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />

      {/* Profile Cover & Avatar Edit Modal */}
      <ProfileCoverEditModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        currentUser={currentUser}
        onSaveCover={(coverUrl) => {
          updateCoverImage(coverUrl);
          setToastMessage('Farm cover banner updated in real-time!');
          setTimeout(() => setToastMessage(null), 4000);
        }}
        onSaveAvatar={(avatarUrl) => {
          updateProfileImage(avatarUrl);
          setToastMessage('Profile avatar updated in real-time!');
          setTimeout(() => setToastMessage(null), 4000);
        }}
        onSaveProfileDetails={(details) => {
          if (currentUser?.id) {
            updateUserProfile(currentUser.id, details);
            updateSellerInfoInProducts(currentUser.id, {
              sellerName: details.name,
              sellerPhone: details.phone,
              sellerWhatsapp: details.whatsapp,
              lga: details.lga,
              location: details.location,
            });
            setToastMessage('Farm profile & listings self-refreshed in real-time!');
            setTimeout(() => setToastMessage(null), 4000);
          }
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        {/* Farmer Cover Photo & Profile Banner Header */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-sm overflow-hidden relative group">
          {/* Cover Picture Banner */}
          <div className="h-44 sm:h-56 md:h-64 w-full relative overflow-hidden bg-gradient-to-r from-[#0F5132] via-[#115433] to-[#0B3D26]">
            <img
              src={currentUser?.coverImage || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1600'}
              alt="Farm Cover Banner"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Edit Cover Photo Floating Glassmorphism Button */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCoverModalOpen(true)}
                className="inline-flex items-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-xs font-extrabold px-3.5 py-2 rounded-xl border border-white/20 shadow-lg transition-all hover:scale-105 active:scale-95"
                title="Edit farm cover picture banner"
              >
                <Camera className="w-4 h-4 text-[#F59E0B]" />
                <span className="hidden sm:inline">Edit Cover Photo</span>
              </button>
            </div>
          </div>

          {/* Overlapping Profile Info Bar */}
          <div className="p-6 md:p-8 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-14 sm:-mt-16 z-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Avatar with Camera Badge */}
              <div
                className="relative group cursor-pointer shrink-0 self-start sm:self-auto"
                onClick={handleAvatarClick}
                title="Click to edit profile picture or cover"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-extrabold text-3xl sm:text-4xl ring-4 ring-white shadow-2xl overflow-hidden bg-cover bg-center">
                  {currentUser?.profileImage ? (
                    <img src={currentUser.profileImage} alt={currentUser.name || 'Producer'} className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.name?.charAt(0) || 'F'
                  )}
                </div>

                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-7 h-7 text-white" />
                </div>

                <button
                  type="button"
                  className="absolute bottom-1 right-1 bg-[#B45309] text-white p-2 rounded-full shadow-lg hover:bg-[#0F5132] transition-colors border-2 border-white"
                  title="Upload profile picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Farmer Info Details */}
              <div className="space-y-1.5 pb-1">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider bg-[#FFFBEB] px-2.5 py-0.5 rounded-md border border-[#FDE68A]">
                    {currentUser?.userType ? `${currentUser.userType} Hub` : 'Producer / Seller Dashboard'}
                  </span>
                  {currentUser?.isVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#0F5132] bg-[#E8F5E9] px-2.5 py-0.5 rounded-md border border-[#C8E6C9]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0F5132]" />
                      <span>Verified Benue Producer</span>
                    </span>
                  )}
                </div>

                <h1 className="font-extrabold text-2xl sm:text-3xl text-[#111827]">{currentUser?.name}</h1>

                <p className="text-xs sm:text-sm text-[#4B5563] font-medium flex items-center flex-wrap gap-x-3 gap-y-1">
                  <span>📍 {currentUser?.location || 'Zaki Biam Yam Market, Ukum LGA'}</span>
                  <span>•</span>
                  <span>📞 {currentUser?.phone}</span>
                </p>

                <button
                  onClick={() => setIsCoverModalOpen(true)}
                  className="text-xs font-extrabold text-[#0F5132] hover:text-[#0B3D26] hover:underline flex items-center gap-1 pt-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Customize Cover Banner & Avatar</span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0">
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#0F5132] border border-[#C8E6C9] hover:bg-emerald-100 text-xs sm:text-sm font-bold px-3.5 py-3 rounded-xl shadow-xs transition-colors"
                title="Contact platform support & Help Desk"
              >
                <HelpCircle className="w-4 h-4 text-[#FEAE3A]" />
                <span>Help Desk</span>
              </button>

              <Link
                to="/sell-produce"
                className="inline-flex items-center gap-2 bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-3 rounded-xl shadow-md transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-[#F59E0B]" />
                <span>Add New Produce Listing</span>
              </Link>

              <button
                onClick={logout}
                className="inline-flex items-center gap-2 bg-[#FBF9F6] text-red-600 border border-red-200 text-xs sm:text-sm font-bold px-4 py-3 rounded-xl hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Active Subscription & Listed Produce Showcase Banner ── */}
        {hasActiveSubscription ? (
          <div className="bg-gradient-to-br from-[#0F5132] via-[#115433] to-[#0B3D26] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/30 relative overflow-hidden animate-in fade-in">
            {/* Subtle Ambient Background Gradients */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 rounded-full bg-[#FEAE3A]/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Header: Plan + Active Badge + Quick Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-wider bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-emerald-200 border border-white/20">
                      Producer Subscription Status
                    </span>
                    
                    {/* LIVE ACTIVE BADGE */}
                    <span className="inline-flex items-center gap-1.5 text-xs font-black bg-emerald-400/20 text-emerald-200 px-3 py-1 rounded-full border border-emerald-400/40 backdrop-blur-md shadow-xs">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                      </span>
                      <span>ACTIVE PLAN</span>
                    </span>

                    {hasGrowthPlan ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black bg-amber-400/20 text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                        <Crown className="w-3.5 h-3.5 text-[#FEAE3A]" />
                        <span>Growth VIP Tier</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black bg-emerald-400/20 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                        <Zap className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Starter Tier</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-3 flex-wrap pt-1">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                      {hasGrowthPlan ? <Crown className="w-7 h-7 text-[#FEAE3A]" /> : <Zap className="w-7 h-7 text-emerald-300" />}
                      <span>{primaryActivePlan}</span>
                    </h2>
                    <span className="text-sm font-extrabold text-emerald-200">
                      ({formatNaira(primaryPlanPrice)} / month)
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl font-medium">
                    {hasGrowthPlan
                      ? 'Spotlight on Homepage Carousel, verified golden badge, and priority connection with wholesale buyers across Nigeria.'
                      : 'Verified produce badge, category search priority, and direct telephone/WhatsApp inquiries from interested buyers.'}
                  </p>
                </div>

                {/* Top Banner Action Buttons: Renew / Upgrade */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (primarySubscribedProduct) {
                        handleOpenAdvertise(primarySubscribedProduct, hasGrowthPlan ? 'renew' : 'upgrade');
                      }
                    }}
                    className="inline-flex items-center gap-2 bg-[#FEAE3A] hover:bg-[#E59D2C] text-[#0F5132] font-black text-xs sm:text-sm px-4 sm:px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
                    title="Renew or Upgrade your produce subscription"
                  >
                    <RefreshCw className="w-4 h-4 text-[#0F5132]" />
                    <span>Renew / Upgrade Plan</span>
                  </button>
                </div>
              </div>

              {/* 4 Informational Showcase Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Card 1: Subscribed Plan */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-1">
                  <div className="flex items-center justify-between text-emerald-200 text-xs font-bold">
                    <span>Subscribed Plan</span>
                    {hasGrowthPlan ? <Crown className="w-4 h-4 text-[#FEAE3A]" /> : <Zap className="w-4 h-4 text-emerald-300" />}
                  </div>
                  <div className="text-lg sm:text-xl font-black text-white">{primaryActivePlan}</div>
                  <p className="text-[11px] text-emerald-200/80 font-medium">{formatNaira(primaryPlanPrice)} / 30-day cycle</p>
                </div>

                {/* Card 2: Plan Status */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-1">
                  <div className="flex items-center justify-between text-emerald-200 text-xs font-bold">
                    <span>Plan Status</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Plan</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 font-medium">Verified & Live Marketplace</p>
                </div>

                {/* Card 3: Active Products Listed */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-1">
                  <div className="flex items-center justify-between text-emerald-200 text-xs font-bold">
                    <span>Active Products Listed</span>
                    <Package className="w-4 h-4 text-[#FEAE3A]" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-white">
                    {totalActiveProductsCount} {totalActiveProductsCount === 1 ? 'Produce Item' : 'Produce Items'}
                  </div>
                  <p className="text-[11px] text-emerald-200/80 font-medium">
                    {boostedProductsCount} promoted with plan
                  </p>
                </div>

                {/* Card 4: Expired Day & Countdown */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-1">
                  <div className="flex items-center justify-between text-emerald-200 text-xs font-bold">
                    <span>Expired Day</span>
                    <Clock className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-white">
                    {nearestExpiryDetails?.relativeShort || `${nearestDaysRemaining}d left`}
                  </div>
                  <p className="text-[11px] text-emerald-200/80 font-medium truncate" title={nearestExpiryDetails?.expiresAtFormatted.full || ''}>
                    Expires: {nearestExpiryDetails?.expiresAtFormatted.date || '30 days duration'}
                  </p>
                </div>
              </div>

              {/* Bottom Schedule & Cycle Progress Bar */}
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Calendar className="w-4 h-4 text-[#FEAE3A] shrink-0" />
                  <span>
                    <strong>Subscription Expiration Schedule:</strong> Active until{' '}
                    <span className="text-white font-bold">{nearestExpiryDetails?.expiresAtFormatted.full || '30 days duration'}</span>
                    {nearestDaysRemaining > 0 && ` (${nearestDaysRemaining} days remaining)`}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-32 bg-white/20 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-[#FEAE3A] h-full rounded-full transition-all"
                      style={{ width: `${cyclePercentage}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-black text-emerald-200">
                    {cyclePercentage}% cycle left
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── No Active Subscription Promotional Banner ── */
          <div className="bg-gradient-to-r from-emerald-900 via-[#0F5132] to-[#145A32] text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-emerald-600/30 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden animate-in fade-in">
            <div className="space-y-1.5 max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full text-emerald-200 border border-white/20">
                <Megaphone className="w-3.5 h-3.5 text-[#FEAE3A]" />
                <span>Boost Your Produce Visibility</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                You Have {totalActiveProductsCount} Active Products Listed — Get 10x More Direct Buyer Inquiries!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 font-medium">
                Subscribe to the <strong>Starter Plan (₦2,000/mo)</strong> or <strong>Growth VIP Plan (₦5,000/mo)</strong> to showcase your harvest in the sponsored homepage spotlight, earn verified producer badges, and connect directly with food aggregators across Nigeria.
              </p>
            </div>

            <div className="shrink-0 relative z-10 flex items-center gap-2.5">
              {farmerListings.length > 0 ? (
                <button
                  type="button"
                  onClick={() => handleOpenAdvertise(farmerListings[0], 'subscribe')}
                  className="inline-flex items-center gap-2 bg-[#FEAE3A] hover:bg-[#E59D2C] text-[#0F5132] font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-[#0F5132]" />
                  <span>Subscribe Produce Now</span>
                </button>
              ) : (
                <Link
                  to="/sell-produce"
                  className="inline-flex items-center gap-2 bg-[#FEAE3A] hover:bg-[#E59D2C] text-[#0F5132] font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  <PlusCircle className="w-4 h-4 text-[#0F5132]" />
                  <span>List Produce to Subscribe</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
            <span className="text-xs font-semibold text-[#4B5563]">Active Public Listings</span>
            <div className="font-extrabold text-3xl text-[#0F5132]">{farmerListings.length}</div>
            <p className="text-[11px] text-[#B45309] font-medium">Visible to buyers across Nigeria</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-1 bg-gradient-to-br from-amber-50/30 to-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#4B5563]">Product Subscriptions</span>
              {hasActiveSubscription && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-[#0F5132] border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active</span>
                </span>
              )}
            </div>
            <div className="font-extrabold text-3xl text-[#B45309] flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-[#F59E0B]" />
              <span>{activeVendorAds.length}</span>
            </div>
            <p className="text-[11px] text-[#B45309] font-medium">
              {hasActiveSubscription ? (
                <span>
                  {primaryActivePlan} ({nearestDaysRemaining}d left)
                </span>
              ) : (
                'Starter (₦2k) & Growth (₦5k)'
              )}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
            <span className="text-xs font-semibold text-[#4B5563]">Seller Rating & Reviews</span>
            <div className="font-extrabold text-2xl text-[#D97706] flex items-center gap-1.5">
              <Star className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]" />
              <span>{currentUser?.averageRating ? currentUser.averageRating.toFixed(1) : '4.9'}</span>
              <span className="text-xs text-[#6B7280] font-semibold">({currentUser?.reviewCount || 12} reviews)</span>
            </div>
            <Link to={`/farmer/${currentUser?.id || 'farmer-1'}`} className="text-[11px] text-[#0F5132] font-bold hover:underline block pt-0.5">
              View public store & reviews →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
            <span className="text-xs font-semibold text-[#4B5563]">Availability Status</span>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (currentUser?.id) {
                    const newStatus = (currentUser.availabilityStatus || 'available') === 'available' ? 'away' : 'available';
                    toggleAvailabilityStatus(currentUser.id, newStatus);
                    setToastMessage(`Your status is now set to "${newStatus === 'available' ? 'Available & Taking Orders' : 'Away / Off-Season'}".`);
                    setTimeout(() => setToastMessage(null), 4000);
                  }
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all border shadow-sm ${
                  (currentUser?.availabilityStatus || 'available') === 'available'
                    ? 'bg-[#E8F5E9] text-[#0F5132] border-[#C8E6C9] hover:bg-[#C8E6C9]'
                    : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] hover:bg-[#FDE68A]'
                }`}
                title="Click to toggle availability status for buyers"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${ (currentUser?.availabilityStatus || 'available') === 'available' ? 'bg-[#10B981] animate-pulse' : 'bg-[#F59E0B]'}`} />
                <span>{(currentUser?.availabilityStatus || 'available') === 'available' ? 'Available & Taking Orders' : 'Away / Off-Season'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#6B7280] font-medium pt-0.5">Click badge to toggle buyer status</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-1">
            <span className="text-xs font-semibold text-[#4B5563]">Marketplace Status</span>
            <div className="font-extrabold text-2xl text-[#0F5132] flex items-center gap-1.5">
              <ShieldCheck className="w-6 h-6 text-[#0F5132]" />
              <span>Verified Seller</span>
            </div>
            <p className="text-[11px] text-[#4B5563]">Joined {currentUser?.joinedDate || 'September 2023'}</p>
          </div>
        </div>

        {/* Active Produce Table */}
        <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xl text-[#0F5132]">My Active Produce Listings</h3>
            <Link
              to="/sell-produce"
              className="text-xs font-bold text-[#0F5132] hover:underline"
            >
              + Create New Listing
            </Link>
          </div>

          {farmerListings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#E8F5E9] text-[#0F5132] font-bold border-b border-[#C8E6C9]">
                    <th className="p-3">Produce Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price / Unit</th>
                    <th className="p-3">Available</th>
                    <th className="p-3">Subscription Plan</th>
                    <th className="p-3">Location & LGA</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {farmerListings.map((item) => {
                    const ad = vendorAds.find((a) => a.productId === item.id);
                    const remainingDays = ad?.expiresAt
                      ? Math.max(0, Math.ceil((new Date(ad.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                      : 0;
                    const isAdActive = ad?.advertisementStatus === 'active';
                    const isGrowth = ad?.plan === 'growth' || ad?.amount === 5000;

                    return (
                      <tr key={item.id} className="hover:bg-[#FBF9F6]">
                        <td className="p-3 font-bold text-[#111827] flex items-center gap-2">
                          <img src={item.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover border border-[#E8E2D9]" />
                          <Link to={`/product/${item.id}`} className="hover:text-[#0F5132]">
                            {item.name}
                          </Link>
                        </td>
                        <td className="p-3 uppercase font-semibold text-[#B45309]">{item.category}</td>
                        <td className="p-3 font-bold text-[#0F5132]">{formatNaira(item.price)} / {item.unit}</td>
                        <td className="p-3 text-[#4B5563]">{item.quantity} units</td>
                        
                        {/* Subscription Status & Expiration Days Badge */}
                        <td className="p-3">
                          {isAdActive ? (
                            <div className="space-y-1.5">
                              {/* Plan Badge + Active Dot */}
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                                isGrowth
                                  ? 'bg-amber-50 text-[#92400E] border-amber-300'
                                  : 'bg-emerald-50 text-[#0F5132] border-emerald-200'
                              }`}>
                                {isGrowth ? <Crown className="w-3 h-3 text-[#B45309]" /> : <Zap className="w-3 h-3 text-[#0F5132]" />}
                                <span>{isGrowth ? 'Growth VIP' : 'Starter'}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                                <span className="text-[9px] font-black text-emerald-600">Active</span>
                              </span>
                              {/* Expiry Info */}
                              <div className="text-[10px] text-[#4B5563] font-semibold flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#6B7280] shrink-0" />
                                <span>Expires in {remainingDays}d</span>
                                {ad?.expiresAt && (
                                  <span className="text-[#9CA3AF]">
                                    ({formatSubscriptionDate(ad.expiresAt)})
                                  </span>
                                )}
                              </div>
                              {/* Quick Renew/Upgrade */}
                              <button
                                type="button"
                                onClick={() => handleOpenAdvertise(item, isGrowth ? 'renew' : 'upgrade')}
                                className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md border transition-colors ${
                                  isGrowth
                                    ? 'text-[#B45309] bg-amber-50 hover:bg-amber-100 border-amber-200'
                                    : 'text-[#0F5132] bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                }`}
                              >
                                {isGrowth ? <RefreshCw className="w-2.5 h-2.5" /> : <ArrowUpRight className="w-2.5 h-2.5" />}
                                <span>{isGrowth ? 'Renew' : 'Upgrade'}</span>
                              </button>
                            </div>
                          ) : ad && ad.advertisementStatus === 'pending' ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending Payment</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenAdvertise(item, 'subscribe')}
                                className="block text-[9px] font-black text-[#0F5132] hover:underline"
                              >
                                Complete Payment →
                              </button>
                            </div>
                          ) : ad && ad.advertisementStatus === 'expired' ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200">
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                <span>Expired Plan</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenAdvertise(item, 'renew')}
                                className="block text-[9px] font-black text-[#0F5132] hover:underline"
                              >
                                Renew Now →
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-medium">Standard Listing</span>
                          )}
                        </td>

                        <td className="p-3 text-[#4B5563]">{item.location} ({item.lga})</td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <Link
                              to={`/product/${item.id}`}
                              className="text-[#0F5132] font-bold hover:underline px-2 py-1"
                            >
                              View
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleOpenAdvertise(item, isAdActive ? 'renew' : 'subscribe')}
                              className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                                isAdActive
                                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                  : ad && ad.advertisementStatus === 'expired'
                                    ? 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200'
                                    : 'text-[#B45309] hover:text-[#92400E] bg-amber-50 hover:bg-amber-100 border-amber-200'
                              }`}
                              title={isAdActive ? 'Click to renew or upgrade plan' : ad?.advertisementStatus === 'expired' ? 'Renew expired subscription' : 'Subscribe to boost produce'}
                            >
                              {isAdActive ? <RefreshCw className="w-3.5 h-3.5" /> : isGrowth ? <Crown className="w-3.5 h-3.5 text-[#B45309]" /> : <Zap className="w-3.5 h-3.5" />}
                              <span>{isAdActive ? 'Renew / Upgrade' : ad?.advertisementStatus === 'expired' ? 'Renew Now' : 'Subscribe'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductToEdit(item)}
                              className="inline-flex items-center gap-1 text-[#0F5132] hover:text-[#0B3D26] font-bold bg-[#E8F5E9] hover:bg-[#C8E6C9] px-2.5 py-1 rounded-lg border border-[#C8E6C9] transition-colors"
                              title="Edit listing"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setProductToDelete(item)}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-bold bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition-colors"
                              title="Delete listing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-[#4B5563]">
              You have no active produce listings yet. Click "Add New Produce Listing" above to publish your harvest.
            </div>
          )}
        </div>

        {/* Farmer Legal & Seller Compliance Banner */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0F5132] flex items-center justify-center shrink-0 border border-emerald-200">
              <Scale className="w-5 h-5 text-[#0F5132]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-[#111827]">Farmer & Seller Compliance Guidelines</h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Terms v{currentUser?.termsAcceptedVersion || '1.0.0'} Active</span>
                </span>
              </div>
              <p className="text-xs text-[#4B5563]">
                Truthful harvest pricing, authentic Benue LGA locations, 0% sales commission, and ₦2,000 Starter / ₦5,000 Growth promotional rules.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 sm:pt-0">
            <Link
              to="/terms?tab=farmer"
              className="text-xs font-bold text-[#0F5132] hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
            >
              Seller Rules
            </Link>
            <Link
              to="/terms?tab=promotion"
              className="text-xs font-bold text-[#B45309] hover:bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
            >
              Promotion Policy
            </Link>
            <Link
              to="/terms"
              className="text-xs font-bold text-[#111827] hover:bg-gray-100 px-3 py-1.5 rounded-xl border border-[#D6CDC0] transition-colors"
            >
              Full Terms
            </Link>
          </div>
        </div>
      </div>

      {/* Support Ticket Modal */}
      <SupportTicketModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        defaultTopic="subscription_plans"
        defaultSubject="Inquiry regarding Produce Subscription Plans (Starter / Growth)"
      />
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Search,
  Filter,
  Eye,
  Ban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Loader2,
  RefreshCw,
  Trash2,
  RotateCcw,
  Archive,
  AlertCircle,
  Calendar,
  User,
  Crown,
  Zap,
  X,
  ArrowUpDown,
  Phone,
  Mail,
} from 'lucide-react';
import type { Advertisement, AdvertisementStatus } from '../../types/advertisement';
import { AD_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, TRASH_RETENTION_DAYS } from '../../types/advertisement';
import {
  fetchAllAdvertisements,
  disableAdvertisement,
  moveAdvertisementToTrash,
  restoreAdvertisementFromTrash,
  permanentlyDeleteAdvertisement,
  emptyTrashBin,
  clearPendingAndFailedAdvertisements,
} from '../../services/advertisingService';
import {
  formatNaira,
  formatSubscriptionDate,
  formatSubscriptionTime,
  getSubscriptionTimeDetails,
} from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { SubscriptionDetailModal } from './SubscriptionDetailModal';

export type ExtendedStatusFilter = AdvertisementStatus | 'all' | 'expiring_soon';
export type SubscriptionSortOption = 'expiring_soonest' | 'newest_active' | 'recently_expired' | 'vendor_name' | 'amount_high';

interface AdminAdvertisingTabProps {
  isSuperAdmin: boolean;
  showToast: (msg: string) => void;
  initialSearchQuery?: string;
  initialStatusFilter?: ExtendedStatusFilter;
}

export const AdminAdvertisingTab: React.FC<AdminAdvertisingTabProps> = ({
  isSuperAdmin: _isSuperAdmin,
  showToast,
  initialSearchQuery = '',
  initialStatusFilter = 'all',
}) => {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<ExtendedStatusFilter>(initialStatusFilter);
  const [planFilter, setPlanFilter] = useState<'all' | 'starter' | 'growth'>('all');
  const [sortBy, setSortBy] = useState<SubscriptionSortOption>('expiring_soonest');

  // Synchronize if initial search query or status filter changes from parent
  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Modals state
  const [inspectModal, setInspectModal] = useState<{ isOpen: boolean; ad: Advertisement | null }>({
    isOpen: false,
    ad: null,
  });
  const [disableModal, setDisableModal] = useState<{ isOpen: boolean; ad: Advertisement | null }>({
    isOpen: false,
    ad: null,
  });
  const [trashModal, setTrashModal] = useState<{ isOpen: boolean; ad: Advertisement | null }>({
    isOpen: false,
    ad: null,
  });
  const [permanentDeleteModal, setPermanentDeleteModal] = useState<{ isOpen: boolean; ad: Advertisement | null }>({
    isOpen: false,
    ad: null,
  });
  const [emptyTrashModalOpen, setEmptyTrashModalOpen] = useState(false);
  const [clearPendingFailedModalOpen, setClearPendingFailedModalOpen] = useState(false);

  const [disableReason, setDisableReason] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    loadAdvertisements();
  }, []);

  const loadAdvertisements = async () => {
    setIsLoading(true);
    try {
      const ads = await fetchAllAdvertisements();
      setAdvertisements(ads);
    } catch {
      setAdvertisements([]);
    }
    setIsLoading(false);
  };

  // Computed stats across all advertisements
  const stats = useMemo(() => {
    const nowMs = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    const active = advertisements.filter((a) => a.advertisementStatus === 'active').length;
    const pending = advertisements.filter((a) => a.advertisementStatus === 'pending').length;
    const expired = advertisements.filter((a) => a.advertisementStatus === 'expired').length;
    
    // Expiring soon: active and expires within 3 days
    const expiringSoon = advertisements.filter((a) => {
      if (a.advertisementStatus !== 'active' || !a.expiresAt) return false;
      const exp = new Date(a.expiresAt).getTime();
      return exp > nowMs && exp - nowMs <= threeDaysMs;
    }).length;

    const failed = advertisements.filter(
      (a) => a.advertisementStatus !== 'trashed' && (a.paymentStatus === 'failed' || a.paymentStatus === 'cancelled')
    ).length;
    const trashed = advertisements.filter((a) => a.advertisementStatus === 'trashed').length;
    const totalRevenue = advertisements
      .filter((a) => a.advertisementStatus !== 'trashed' && a.paymentStatus === 'success')
      .reduce((sum, a) => sum + a.amount, 0);

    const nonTrashedTotal = advertisements.filter((a) => a.advertisementStatus !== 'trashed').length;

    return { active, pending, expired, expiringSoon, failed, trashed, totalRevenue, total: nonTrashedTotal };
  }, [advertisements]);

  // Filtered and sorted subscription list
  const filteredAds = useMemo(() => {
    const nowMs = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    const list = advertisements.filter((ad) => {
      // 1. Status Filter
      let matchesStatus = true;
      if (statusFilter === 'all') {
        matchesStatus = ad.advertisementStatus !== 'trashed';
      } else if (statusFilter === 'expiring_soon') {
        if (ad.advertisementStatus !== 'active' || !ad.expiresAt) {
          matchesStatus = false;
        } else {
          const exp = new Date(ad.expiresAt).getTime();
          matchesStatus = exp > nowMs && exp - nowMs <= threeDaysMs;
        }
      } else {
        matchesStatus = ad.advertisementStatus === statusFilter;
      }

      // 2. Plan Filter
      let matchesPlan = true;
      if (planFilter !== 'all') {
        const isGrowth = ad.plan === 'growth' || ad.amount === 5000;
        matchesPlan = planFilter === 'growth' ? isGrowth : !isGrowth;
      }

      // 3. User / Subscription Multi-field Search
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (ad.vendorName || '').toLowerCase().includes(q) ||
        (ad.vendorEmail || '').toLowerCase().includes(q) ||
        (ad.vendorPhone || '').toLowerCase().includes(q) ||
        (ad.vendorId || '').toLowerCase().includes(q) ||
        (ad.productName || '').toLowerCase().includes(q) ||
        (ad.productId || '').toLowerCase().includes(q) ||
        (ad.paymentReference || '').toLowerCase().includes(q) ||
        (ad.plan || '').toLowerCase().includes(q) ||
        (ad.advertisementStatus || '').toLowerCase().includes(q) ||
        (ad.paymentStatus || '').toLowerCase().includes(q);

      return matchesStatus && matchesPlan && matchesSearch;
    });

    // 4. Sort list
    return list.sort((a, b) => {
      if (sortBy === 'expiring_soonest') {
        const timeA = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
        const timeB = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
        // Prioritize active ones first
        if (a.advertisementStatus === 'active' && b.advertisementStatus !== 'active') return -1;
        if (b.advertisementStatus === 'active' && a.advertisementStatus !== 'active') return 1;
        return timeA - timeB;
      }
      if (sortBy === 'newest_active') {
        const timeA = a.startsAt ? new Date(a.startsAt).getTime() : new Date(a.createdAt).getTime();
        const timeB = b.startsAt ? new Date(b.startsAt).getTime() : new Date(b.createdAt).getTime();
        return timeB - timeA;
      }
      if (sortBy === 'recently_expired') {
        const timeA = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
        const timeB = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === 'vendor_name') {
        return (a.vendorName || '').localeCompare(b.vendorName || '');
      }
      if (sortBy === 'amount_high') {
        return b.amount - a.amount;
      }
      return 0;
    });
  }, [advertisements, statusFilter, planFilter, searchQuery, sortBy]);

  // Calculate days remaining in trash before 30-day auto-purge
  const getDaysRemainingInTrash = (trashedAt?: string | null): number => {
    if (!trashedAt) return TRASH_RETENTION_DAYS;
    const elapsedMs = Date.now() - new Date(trashedAt).getTime();
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    return Math.max(0, TRASH_RETENTION_DAYS - elapsedDays);
  };

  const handleDisableAd = async () => {
    if (!disableModal.ad || !disableReason.trim()) return;
    setIsDisabling(true);

    const success = await disableAdvertisement(disableModal.ad.id, disableReason.trim());
    if (success) {
      setAdvertisements((prev) =>
        prev.map((a) =>
          a.id === disableModal.ad!.id
            ? { ...a, advertisementStatus: 'disabled' as AdvertisementStatus, disabledReason: disableReason.trim() }
            : a
        )
      );
      showToast(`✅ Subscription for "${disableModal.ad.productName}" has been disabled.`);
    } else {
      showToast('❌ Failed to disable subscription. Please try again.');
    }

    setIsDisabling(false);
    setDisableModal({ isOpen: false, ad: null });
    setDisableReason('');
  };

  // Move Advertisement (Active, Failed, Pending, Expired, Disabled) to Trash
  const handleMoveToTrash = async (adToTrash?: Advertisement) => {
    const targetAd = adToTrash || trashModal.ad;
    if (!targetAd) return;
    setIsProcessingAction(true);

    const originalStatus = targetAd.advertisementStatus.toUpperCase();
    const updated = await moveAdvertisementToTrash(targetAd);

    if (updated) {
      setAdvertisements((prev) =>
        prev.map((a) => (a.id === targetAd.id ? updated : a))
      );
      showToast(
        `🗑️ ${originalStatus} subscription for "${targetAd.productName || 'Product'}" moved to Trash.`
      );
    } else {
      showToast('❌ Failed to move subscription to Trash.');
    }

    setIsProcessingAction(false);
    setTrashModal({ isOpen: false, ad: null });
  };

  // Restore Advertisement from Trash Bin
  const handleRestoreAd = async (ad: Advertisement) => {
    setIsProcessingAction(true);
    const restored = await restoreAdvertisementFromTrash(ad);

    if (restored) {
      setAdvertisements((prev) =>
        prev.map((a) => (a.id === ad.id ? restored : a))
      );
      showToast(
        `✨ Restored subscription for "${ad.productName || 'Product'}" back to ${restored.advertisementStatus.toUpperCase()} status.`
      );
    } else {
      showToast('❌ Failed to restore subscription.');
    }

    setIsProcessingAction(false);
  };

  // Permanent Delete Advertisement
  const handlePermanentDelete = async (adToDelete?: Advertisement) => {
    const targetAd = adToDelete || permanentDeleteModal.ad;
    if (!targetAd) return;
    setIsProcessingAction(true);

    const success = await permanentlyDeleteAdvertisement(targetAd.id);

    if (success) {
      setAdvertisements((prev) => prev.filter((a) => a.id !== targetAd.id));
      showToast(`💥 Permanently deleted subscription record for "${targetAd.productName || 'Product'}".`);
    } else {
      showToast('❌ Failed to permanently delete subscription.');
    }

    setIsProcessingAction(false);
    setPermanentDeleteModal({ isOpen: false, ad: null });
  };

  // Empty Trash Bin
  const handleEmptyTrash = async () => {
    setIsProcessingAction(true);
    const count = await emptyTrashBin();

    setAdvertisements((prev) => prev.filter((a) => a.advertisementStatus !== 'trashed'));
    showToast(`🗑️ Emptied Trash Bin. Permanently purged ${count} subscription records.`);

    setIsProcessingAction(false);
    setEmptyTrashModalOpen(false);
  };

  // Bulk Move Expired / Failed to Trash
  const handleBulkTrashExpiredAndFailed = async () => {
    const toTrash = advertisements.filter(
      (a) =>
        a.advertisementStatus !== 'trashed' &&
        (a.advertisementStatus === 'expired' || a.paymentStatus === 'failed' || a.paymentStatus === 'cancelled')
    );

    if (toTrash.length === 0) {
      showToast('Info: No expired or failed subscription records to move to Trash.');
      return;
    }

    setIsProcessingAction(true);
    let count = 0;
    const trashedResults: Advertisement[] = [];

    for (const ad of toTrash) {
      const res = await moveAdvertisementToTrash(ad);
      if (res) {
        count++;
        trashedResults.push(res);
      }
    }

    setAdvertisements((prev) =>
      prev.map((item) => {
        const trashedItem = trashedResults.find((t) => t.id === item.id);
        return trashedItem || item;
      })
    );

    showToast(`🗑️ Moved ${count} expired/failed subscription record${count > 1 ? 's' : ''} to Trash.`);
    setIsProcessingAction(false);
  };

  // Permanently clear all pending and failed/cancelled records so only new ones stand
  const handleClearPendingAndFailed = async () => {
    setIsProcessingAction(true);
    const count = await clearPendingAndFailedAdvertisements();
    await loadAdvertisements();
    showToast(`💥 Permanently cleared ${count} pending and failed subscription records.`);
    setIsProcessingAction(false);
    setClearPendingFailedModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats Quick Filter Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-white p-4 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            statusFilter === 'all'
              ? 'border-[#0F5132] ring-2 ring-[#0F5132]/20 shadow-sm scale-[1.01]'
              : 'border-[#E8E2D9] hover:border-[#0F5132]'
          }`}
        >
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Subscriptions</span>
            <Megaphone className="w-4 h-4 text-[#0F5132]" />
          </div>
          <span className="text-2xl font-extrabold text-[#111827]">{stats.total}</span>
        </div>

        {/* Active Subscriptions */}
        <div
          onClick={() => setStatusFilter('active')}
          className={`p-4 rounded-2xl border shadow-xs bg-gradient-to-br from-emerald-50/40 to-white cursor-pointer transition-all ${
            statusFilter === 'active'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm scale-[1.01]'
              : 'border-emerald-200 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Active</span>
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-700">{stats.active}</span>
            <span className="text-[10px] text-emerald-600 font-bold">With Dates</span>
          </div>
        </div>

        {/* Expiring Soon */}
        <div
          onClick={() => setStatusFilter('expiring_soon')}
          className={`p-4 rounded-2xl border shadow-xs bg-gradient-to-br from-amber-50/40 to-white cursor-pointer transition-all ${
            statusFilter === 'expiring_soon'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm scale-[1.01]'
              : 'border-amber-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Expiring &lt;3d</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-700">{stats.expiringSoon}</span>
            <span className="text-[10px] text-amber-600 font-semibold">Soon</span>
          </div>
        </div>

        {/* Expired Subscriptions */}
        <div
          onClick={() => setStatusFilter('expired')}
          className={`bg-white p-4 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            statusFilter === 'expired'
              ? 'border-gray-500 ring-2 ring-gray-400/20 shadow-sm scale-[1.01]'
              : 'border-[#E8E2D9] hover:border-gray-400'
          }`}
        >
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700">Expired</span>
            <XCircle className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-gray-600">{stats.expired}</span>
            <span className="text-[10px] text-gray-400 font-medium">History</span>
          </div>
        </div>

        {/* Failed / Pending */}
        <div
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border shadow-xs bg-gradient-to-br from-amber-50/20 to-white cursor-pointer transition-all ${
            statusFilter === 'pending'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm scale-[1.01]'
              : 'border-amber-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-extrabold text-amber-600">{stats.pending}</span>
        </div>

        {/* Trash Bin */}
        <div
          onClick={() => setStatusFilter('trashed')}
          className={`p-4 rounded-2xl border shadow-xs bg-gradient-to-br from-purple-50/40 to-white cursor-pointer transition-all ${
            statusFilter === 'trashed'
              ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-sm scale-[1.01]'
              : 'border-purple-200 hover:border-purple-400'
          }`}
        >
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Trash Bin</span>
            <Trash2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-purple-700">{stats.trashed}</span>
            <span className="text-[9px] text-purple-500 font-medium">Auto: 30d</span>
          </div>
        </div>
      </div>

      {/* Revenue Indicator Bar */}
      <div className="bg-gradient-to-r from-[#0F5132] via-[#11623d] to-[#0B3D26] p-4 rounded-2xl border border-emerald-800 shadow-sm text-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-[#FEAE3A]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Total Product Subscription Revenue
            </h4>
            <p className="text-2xl font-black text-white">{formatNaira(stats.totalRevenue)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {stats.active > 0 && (
            <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-xs font-bold text-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{stats.active} Active Promoted Harvests</span>
            </div>
          )}

          {stats.trashed > 0 && statusFilter !== 'trashed' && (
            <button
              type="button"
              onClick={() => setStatusFilter('trashed')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all shadow-xs"
            >
              <Trash2 className="w-4 h-4 text-purple-300" />
              <span>View Trash Bin ({stats.trashed})</span>
            </button>
          )}
        </div>
      </div>

      {/* USER SUBSCRIPTION SEARCH & FILTER CONTROLS */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-4 shadow-xs space-y-3">
        {/* Main Search Row */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          {/* Prominent Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#0F5132] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users subscription by farmer name, email, phone, user ID, produce, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                title="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Dropdown Filters */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Status Selector */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#D6CDC0]">
              <Filter className="w-3.5 h-3.5 text-[#0F5132]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ExtendedStatusFilter)}
                className="bg-transparent text-xs text-[#111827] font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">All Subscriptions ({stats.total})</option>
                <option value="active">Active Only ({stats.active})</option>
                <option value="expiring_soon">Expiring Soon &lt;3d ({stats.expiringSoon})</option>
                <option value="expired">Expired Subscriptions ({stats.expired})</option>
                <option value="pending">Pending Payment ({stats.pending})</option>
                <option value="disabled">Disabled Subscriptions</option>
                <option value="cancelled">Cancelled / Failed ({stats.failed})</option>
                <option value="trashed">🗑️ Trash Bin ({stats.trashed})</option>
              </select>
            </div>

            {/* Plan Tier Selector */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#D6CDC0]">
              <Crown className="w-3.5 h-3.5 text-[#B45309]" />
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as 'all' | 'starter' | 'growth')}
                className="bg-transparent text-xs text-[#111827] font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">All Plans</option>
                <option value="growth">Growth VIP (₦5,000)</option>
                <option value="starter">Starter (₦2,000)</option>
              </select>
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-[#D6CDC0]">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SubscriptionSortOption)}
                className="bg-transparent text-xs text-[#111827] font-bold focus:outline-none cursor-pointer"
              >
                <option value="expiring_soonest">Sort: Expiring Soonest</option>
                <option value="newest_active">Sort: Newest Active First</option>
                <option value="recently_expired">Sort: Recently Expired</option>
                <option value="vendor_name">Sort: User / Farmer (A-Z)</option>
                <option value="amount_high">Sort: Fee (High to Low)</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadAdvertisements}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#0F5132] text-xs font-bold rounded-xl border border-[#C8E6C9] transition-colors shrink-0"
              title="Refresh subscriptions from database"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Active Search & Filter Tags Bar */}
        {(searchQuery || statusFilter !== 'all' || planFilter !== 'all') && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E8E2D9] text-xs flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[#6B7280]">Active Filters:</span>

              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E8F5E9] text-[#0F5132] font-bold text-[11px] border border-[#C8E6C9]">
                  <User className="w-3 h-3 text-[#0F5132]" />
                  <span>User/Query: "{searchQuery}"</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:text-red-700 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-[11px] border border-amber-200">
                  <span>Status: {statusFilter.replace('_', ' ').toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className="hover:text-red-700 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {planFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-bold text-[11px] border border-purple-200">
                  <span>Plan: {planFilter === 'growth' ? 'Growth VIP' : 'Starter'}</span>
                  <button
                    type="button"
                    onClick={() => setPlanFilter('all')}
                    className="hover:text-red-700 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setPlanFilter('all');
                }}
                className="text-[11px] text-[#0F5132] hover:underline font-bold ml-1"
              >
                Reset All Filters
              </button>
            </div>

            <div className="text-[11px] font-bold text-[#4B5563]">
              Showing <span className="text-[#0F5132] font-black">{filteredAds.length}</span> of {advertisements.length} subscriptions
            </div>
          </div>
        )}

        {/* Bulk Actions (Trash / Purge) */}
        <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
          {statusFilter === 'trashed' && stats.trashed > 0 && (
            <button
              type="button"
              onClick={() => setEmptyTrashModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Trash ({stats.trashed})</span>
            </button>
          )}

          {statusFilter !== 'trashed' && (stats.expired > 0 || stats.failed > 0) && (
            <button
              type="button"
              onClick={handleBulkTrashExpiredAndFailed}
              disabled={isProcessingAction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-colors shrink-0"
              title="Move all expired and failed subscription records to Trash Bin"
            >
              <Archive className="w-3.5 h-3.5 text-amber-600" />
              <span>Move Expired/Failed to Trash ({stats.expired + stats.failed})</span>
            </button>
          )}

          {statusFilter !== 'trashed' && (stats.pending > 0 || stats.failed > 0) && (
            <button
              type="button"
              onClick={() => setClearPendingFailedModalOpen(true)}
              disabled={isProcessingAction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition-colors shrink-0"
              title="Permanently clear all pending and failed subscription records"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Clear Pending/Failed ({stats.pending + stats.failed})</span>
            </button>
          )}
        </div>
      </div>

      {/* Trash Bin Header Banner (when statusFilter === 'trashed') */}
      {statusFilter === 'trashed' && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-purple-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-purple-900">Subscription Trash Bin</h4>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Deleted subscriptions stay in Trash for <strong>30 days</strong> before automatic permanent deletion. You can restore them anytime.
              </p>
            </div>
          </div>
          {stats.trashed > 0 && (
            <button
              type="button"
              onClick={() => setEmptyTrashModalOpen(true)}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
            >
              Empty Trash Now
            </button>
          )}
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#0F5132] animate-spin" />
            <p className="text-xs font-bold text-[#6B7280]">Loading verified subscriptions...</p>
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Megaphone className="w-12 h-12 text-[#D6CDC0] mx-auto mb-3" />
            <p className="text-sm font-bold text-[#111827]">
              {searchQuery
                ? `No subscriptions found matching "${searchQuery}"`
                : statusFilter === 'trashed'
                ? 'Trash Bin is empty'
                : 'No subscriptions found'}
            </p>
            <p className="text-xs text-[#6B7280] mt-1 max-w-md mx-auto">
              {searchQuery
                ? 'Try searching with a different user name, phone number, email address, or produce keyword.'
                : statusFilter !== 'all'
                ? 'Try changing the status or plan filter above.'
                : 'Farmers can subscribe to Starter (₦2k) or Growth VIP (₦5k) boost plans from their Farmer Dashboard.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9] text-[#0F5132] font-bold text-xs rounded-xl hover:bg-[#C8E6C9] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Search</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#E8F5E9] text-[#0F5132] font-bold border-b border-[#C8E6C9]">
                  <th className="p-3.5">Subscribed User / Farmer</th>
                  <th className="p-3.5">Produce Listing</th>
                  <th className="p-3.5">Plan & Fee</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Active (Start Date & Time)</span>
                    </div>
                  </th>
                  <th className="p-3.5">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Expiration (Expired Date & Time)</span>
                    </div>
                  </th>
                  <th className="p-3.5">Reference</th>
                  <th className="p-3.5 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredAds.map((ad) => {
                  const daysRemaining = getDaysRemainingInTrash(ad.trashedAt);
                  const isTrashed = ad.advertisementStatus === 'trashed';
                  const previousStatus = ad.previousStatus || 'active';
                  const isGrowth = ad.plan === 'growth' || ad.amount === 5000;
                  const timeDetails = getSubscriptionTimeDetails(
                    ad.startsAt,
                    ad.expiresAt,
                    ad.advertisementStatus
                  );

                  return (
                    <tr
                      key={ad.id}
                      className={`hover:bg-[#FAF8F5] transition-colors ${
                        isTrashed
                          ? 'bg-purple-50/20'
                          : timeDetails.isExpired
                          ? 'bg-gray-50/50'
                          : timeDetails.urgency === 'danger'
                          ? 'bg-red-50/20'
                          : timeDetails.urgency === 'warning'
                          ? 'bg-amber-50/20'
                          : ''
                      }`}
                    >
                      {/* Subscribed User / Farmer */}
                      <td className="p-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#0F5132] text-white font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {(ad.vendorName || 'U').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setSearchQuery(ad.vendorName || '')}
                              className="font-extrabold text-[#111827] hover:text-[#0F5132] truncate block max-w-[150px] text-left"
                              title={`Click to filter all subscriptions by ${ad.vendorName}`}
                            >
                              {ad.vendorName || 'Unknown Farmer'}
                            </button>
                            {ad.vendorEmail && (
                              <span className="text-[10px] text-[#6B7280] truncate flex items-center gap-1 max-w-[150px]">
                                <Mail className="w-2.5 h-2.5 shrink-0 text-gray-400" />
                                <span className="truncate">{ad.vendorEmail}</span>
                              </span>
                            )}
                            {ad.vendorPhone && (
                              <span className="text-[10px] text-[#4B5563] truncate flex items-center gap-1 max-w-[150px]">
                                <Phone className="w-2.5 h-2.5 shrink-0 text-[#0F5132]" />
                                <span>{ad.vendorPhone}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Produce Listing */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          {ad.productImage ? (
                            <img
                              src={ad.productImage}
                              alt=""
                              className="w-9 h-9 rounded-xl object-cover border border-[#E8E2D9] shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0">
                              BM
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              to={`/product/${ad.productId}`}
                              className="font-bold text-[#111827] hover:text-[#0F5132] truncate block max-w-[150px]"
                              title={ad.productName || 'View Product'}
                            >
                              {ad.productName || 'Agricultural Produce'}
                            </Link>
                            {ad.productPrice && (
                              <span className="text-[10px] text-[#4B5563] font-semibold">
                                {formatNaira(ad.productPrice)}{ad.productUnit ? ` / ${ad.productUnit}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Plan & Amount */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-black text-[#0F5132] block text-[13px]">
                            {formatNaira(ad.amount)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                              isGrowth
                                ? 'bg-amber-100 text-[#92400E] border-amber-300'
                                : 'bg-emerald-100 text-[#0F5132] border-emerald-200'
                            }`}
                          >
                            {isGrowth ? <Crown className="w-2.5 h-2.5 text-[#B45309]" /> : <Zap className="w-2.5 h-2.5" />}
                            <span>{isGrowth ? 'Growth VIP' : 'Starter'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {isTrashed ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border bg-purple-100 text-purple-800 border-purple-300">
                              <Trash2 className="w-3 h-3" />
                              <span>TRASHED</span>
                            </span>
                            <span className="block text-[9px] font-medium text-gray-500 capitalize">
                              Was: <strong>{previousStatus}</strong>
                            </span>
                          </div>
                        ) : ad.advertisementStatus === 'active' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-800 border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>ACTIVE</span>
                            </span>
                            <span className={`block text-[9px] font-bold ${
                              timeDetails.urgency === 'danger'
                                ? 'text-red-600'
                                : timeDetails.urgency === 'warning'
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}>
                              {timeDetails.relativeShort}
                            </span>
                          </div>
                        ) : ad.advertisementStatus === 'expired' || timeDetails.isExpired ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border bg-gray-100 text-gray-700 border-gray-300">
                              <XCircle className="w-3 h-3 text-gray-500" />
                              <span>EXPIRED</span>
                            </span>
                            <span className="block text-[9px] font-medium text-gray-500">
                              {timeDetails.relativeShort}
                            </span>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                              AD_STATUS_CONFIG[ad.advertisementStatus]?.bgColor || 'bg-gray-100'
                            } ${AD_STATUS_CONFIG[ad.advertisementStatus]?.color || 'text-gray-700'} ${
                              AD_STATUS_CONFIG[ad.advertisementStatus]?.borderColor || 'border-gray-200'
                            }`}
                          >
                            {AD_STATUS_CONFIG[ad.advertisementStatus]?.label || ad.advertisementStatus}
                          </span>
                        )}
                      </td>

                      {/* ACTIVE START DATE & TIME */}
                      <td className="p-3.5">
                        {ad.startsAt ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-extrabold text-[#111827]">
                              <Calendar className="w-3.5 h-3.5 text-[#0F5132] shrink-0" />
                              <span>{formatSubscriptionDate(ad.startsAt)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#0F5132]">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{formatSubscriptionTime(ad.startsAt) || '12:00 PM'}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#9CA3AF] text-[11px] font-medium">Pending start</span>
                        )}
                      </td>

                      {/* EXPIRED DATE & TIME */}
                      <td className="p-3.5">
                        {isTrashed ? (
                          <div className="inline-flex items-center gap-1 text-purple-700 font-bold bg-purple-100/60 px-2 py-1 rounded-lg border border-purple-200">
                            <Clock className="w-3 h-3 text-purple-600 shrink-0" />
                            <span>Purges in {daysRemaining}d</span>
                          </div>
                        ) : ad.expiresAt ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-extrabold text-[#111827]">
                              <Calendar className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
                              <span>{formatSubscriptionDate(ad.expiresAt)}</span>
                            </div>
                            <div className={`flex items-center gap-1.5 text-[10px] font-bold ${
                              timeDetails.isExpired ? 'text-red-600' : 'text-[#B45309]'
                            }`}>
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{formatSubscriptionTime(ad.expiresAt) || '12:00 PM'}</span>
                            </div>
                            <span className={`block text-[9px] font-semibold ${
                              timeDetails.isExpired
                                ? 'text-gray-500'
                                : timeDetails.urgency === 'danger'
                                ? 'text-red-600 font-extrabold'
                                : 'text-emerald-700'
                            }`}>
                              {timeDetails.countdownText}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#9CA3AF] text-[11px] font-medium">—</span>
                        )}
                      </td>

                      {/* Reference */}
                      <td className="p-3.5">
                        <span
                          className="text-[10px] font-mono text-[#4B5563] truncate block max-w-[90px]"
                          title={ad.paymentReference || ''}
                        >
                          {ad.paymentReference || '—'}
                        </span>
                        <span className={`inline-block text-[9px] font-extrabold uppercase mt-0.5 ${
                          PAYMENT_STATUS_CONFIG[ad.paymentStatus]?.color || 'text-gray-600'
                        }`}>
                          {PAYMENT_STATUS_CONFIG[ad.paymentStatus]?.label || ad.paymentStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect / View Details Button */}
                          <button
                            type="button"
                            onClick={() => setInspectModal({ isOpen: true, ad })}
                            className="inline-flex items-center gap-1 text-[#0F5132] hover:text-[#0B3D26] font-bold bg-[#E8F5E9] hover:bg-[#C8E6C9] px-2.5 py-1.5 rounded-xl border border-[#C8E6C9] transition-colors"
                            title="Inspect complete date/time schedule & user details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>

                          {/* Trashed Item Actions */}
                          {isTrashed ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRestoreAd(ad)}
                                disabled={isProcessingAction}
                                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-1.5 rounded-xl border border-emerald-200 transition-colors"
                                title={`Restore subscription back to ${previousStatus}`}
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPermanentDeleteModal({ isOpen: true, ad })}
                                disabled={isProcessingAction}
                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-bold bg-red-50 hover:bg-red-100 px-2 py-1.5 rounded-xl border border-red-200 transition-colors"
                                title="Permanently Delete Immediately"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Purge</span>
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Disable Active Ad */}
                              {ad.advertisementStatus === 'active' && (
                                <button
                                  type="button"
                                  onClick={() => setDisableModal({ isOpen: true, ad })}
                                  className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 px-2 py-1.5 rounded-xl border border-amber-200 transition-colors"
                                  title="Disable Subscription"
                                >
                                  <Ban className="w-3 h-3" />
                                  <span>Disable</span>
                                </button>
                              )}

                              {/* Move to Trash Button */}
                              <button
                                type="button"
                                onClick={() => setTrashModal({ isOpen: true, ad })}
                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-bold bg-red-50 hover:bg-red-100 px-2 py-1.5 rounded-xl border border-red-200 transition-colors"
                                title={`Move ${ad.advertisementStatus.toUpperCase()} subscription to Trash`}
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subscription Deep Inspection Modal */}
      <SubscriptionDetailModal
        isOpen={inspectModal.isOpen}
        onClose={() => setInspectModal({ isOpen: false, ad: null })}
        subscription={inspectModal.ad}
        onFilterByUser={(userQuery) => setSearchQuery(userQuery)}
        onDisable={(ad) => setDisableModal({ isOpen: true, ad })}
        onMoveToTrash={(ad) => setTrashModal({ isOpen: true, ad })}
        onRestore={handleRestoreAd}
        onPermanentDelete={(ad) => setPermanentDeleteModal({ isOpen: true, ad })}
      />

      {/* Disable Confirmation Modal */}
      {disableModal.isOpen && disableModal.ad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Ban className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#111827]">Disable Subscription</h3>
                <p className="text-xs text-[#4B5563]">
                  "{disableModal.ad.productName}" by {disableModal.ad.vendorName}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              This will immediately deactivate the produce boost and remove the listing from sponsored visibility. The user will not receive a refund. Please provide an administrative reason.
            </p>

            <textarea
              value={disableReason}
              onChange={(e) => setDisableReason(e.target.value)}
              placeholder="Enter reason for disabling this subscription..."
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-amber-400 min-h-[80px] resize-none"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDisableModal({ isOpen: false, ad: null });
                  setDisableReason('');
                }}
                className="flex-1 px-4 py-2.5 bg-[#FAF8F5] text-[#4B5563] text-xs font-bold rounded-xl border border-[#E8E2D9] hover:bg-[#E8E2D9] transition-colors"
                disabled={isDisabling}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisableAd}
                disabled={isDisabling || !disableReason.trim()}
                className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl shadow-sm transition-colors inline-flex items-center justify-center gap-2"
              >
                {isDisabling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4" />
                )}
                <span>Disable Subscription</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move to Trash Confirmation Modal */}
      {trashModal.isOpen && trashModal.ad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#111827]">Move Subscription to Trash</h3>
                <p className="text-xs text-[#4B5563]">
                  "{trashModal.ad.productName || 'Produce Product'}"
                </p>
              </div>
            </div>

            {/* Explicit Status Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Subscription Status: </span>
                <span className="font-black tracking-wide uppercase underline">
                  {trashModal.ad.advertisementStatus}
                </span>
                {trashModal.ad.paymentStatus === 'failed' || trashModal.ad.paymentStatus === 'cancelled' ? (
                  <span className="ml-1 text-red-600 font-bold">(Payment: {trashModal.ad.paymentStatus.toUpperCase()})</span>
                ) : null}
              </div>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Subscriber:</span>
                <span className="font-bold text-[#111827]">{trashModal.ad.vendorName || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Paid:</span>
                <span className="font-bold text-[#0F5132]">{formatNaira(trashModal.ad.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Reference:</span>
                <span className="font-mono text-[#0F5132] font-bold">{trashModal.ad.paymentReference || 'N/A'}</span>
              </div>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              This <strong>{trashModal.ad.advertisementStatus.toUpperCase()}</strong> subscription will be moved to the Trash Bin. It will remain in Trash for <strong>30 days</strong>, allowing you to restore it anytime before automatic permanent deletion.
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setTrashModal({ isOpen: false, ad: null })}
                className="flex-1 px-4 py-2.5 bg-[#FAF8F5] text-[#4B5563] text-xs font-bold rounded-xl border border-[#E8E2D9] hover:bg-[#E8E2D9] transition-colors"
                disabled={isProcessingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleMoveToTrash()}
                disabled={isProcessingAction}
                className="flex-1 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl shadow-sm transition-colors inline-flex items-center justify-center gap-2"
              >
                {isProcessingAction ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Move to Trash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {permanentDeleteModal.isOpen && permanentDeleteModal.ad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-red-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#111827]">Permanently Purge Record</h3>
                <p className="text-xs text-[#4B5563]">
                  "{permanentDeleteModal.ad.productName || 'Produce Product'}"
                </p>
              </div>
            </div>

            <p className="text-xs text-red-600 font-semibold leading-relaxed bg-red-50 p-3 rounded-xl border border-red-200">
              ⚠️ <strong>WARNING:</strong> This action cannot be undone! This subscription record will be deleted permanently immediately.
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPermanentDeleteModal({ isOpen: false, ad: null })}
                className="flex-1 px-4 py-2.5 bg-[#FAF8F5] text-[#4B5563] text-xs font-bold rounded-xl border border-[#E8E2D9] hover:bg-[#E8E2D9] transition-colors"
                disabled={isProcessingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePermanentDelete()}
                disabled={isProcessingAction}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl shadow-sm transition-colors inline-flex items-center justify-center gap-2"
              >
                {isProcessingAction ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Purge Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Trash Bin Confirmation Modal */}
      {emptyTrashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-red-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#111827]">Empty Trash Bin</h3>
                <p className="text-xs text-[#4B5563]">Purge all trashed subscriptions ({stats.trashed} items)</p>
              </div>
            </div>

            <p className="text-xs text-red-600 font-semibold leading-relaxed bg-red-50 p-3 rounded-xl border border-red-200">
              ⚠️ Are you sure you want to empty the Trash Bin? All <strong>{stats.trashed}</strong> trashed subscription records will be permanently erased.
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setEmptyTrashModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-[#FAF8F5] text-[#4B5563] text-xs font-bold rounded-xl border border-[#E8E2D9] hover:bg-[#E8E2D9] transition-colors"
                disabled={isProcessingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmptyTrash}
                disabled={isProcessingAction}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl shadow-sm transition-colors inline-flex items-center justify-center gap-2"
              >
                {isProcessingAction ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Empty Trash Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Pending & Failed Confirmation Modal */}
      {clearPendingFailedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-red-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#111827]">Clear Pending & Failed Subscriptions</h3>
                <p className="text-xs text-[#4B5563]">Purge all old pending & failed records ({stats.pending + stats.failed} items)</p>
              </div>
            </div>

            <p className="text-xs text-red-600 font-semibold leading-relaxed bg-red-50 p-3 rounded-xl border border-red-200">
              ⚠️ Are you sure you want to permanently clear all <strong>{stats.pending + stats.failed}</strong> pending and failed subscription records? This leaves a clean slate.
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setClearPendingFailedModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-[#FAF8F5] text-[#4B5563] text-xs font-bold rounded-xl border border-[#E8E2D9] hover:bg-[#E8E2D9] transition-colors"
                disabled={isProcessingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearPendingAndFailed}
                disabled={isProcessingAction}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl shadow-sm transition-colors inline-flex items-center justify-center gap-2"
              >
                {isProcessingAction ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Clear All Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

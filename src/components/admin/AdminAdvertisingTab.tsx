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
import { formatNaira } from '../../utils/formatters';
import { Link } from 'react-router-dom';

interface AdminAdvertisingTabProps {
  isSuperAdmin: boolean;
  showToast: (msg: string) => void;
}

export const AdminAdvertisingTab: React.FC<AdminAdvertisingTabProps> = ({
  isSuperAdmin: _isSuperAdmin,
  showToast,
}) => {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdvertisementStatus | 'all'>('all');

  // Modals state
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

  // Computed stats
  const stats = useMemo(() => {
    const active = advertisements.filter((a) => a.advertisementStatus === 'active').length;
    const pending = advertisements.filter((a) => a.advertisementStatus === 'pending').length;
    const expired = advertisements.filter((a) => a.advertisementStatus === 'expired').length;
    const failed = advertisements.filter(
      (a) => a.advertisementStatus !== 'trashed' && (a.paymentStatus === 'failed' || a.paymentStatus === 'cancelled')
    ).length;
    const trashed = advertisements.filter((a) => a.advertisementStatus === 'trashed').length;
    const totalRevenue = advertisements
      .filter((a) => a.advertisementStatus !== 'trashed' && a.paymentStatus === 'success')
      .reduce((sum, a) => sum + a.amount, 0);

    const nonTrashedTotal = advertisements.filter((a) => a.advertisementStatus !== 'trashed').length;

    return { active, pending, expired, failed, trashed, totalRevenue, total: nonTrashedTotal };
  }, [advertisements]);

  // Filtered list
  const filteredAds = useMemo(() => {
    return advertisements.filter((ad) => {
      let matchesStatus = true;
      if (statusFilter === 'all') {
        matchesStatus = ad.advertisementStatus !== 'trashed';
      } else {
        matchesStatus = ad.advertisementStatus === statusFilter;
      }

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (ad.vendorName || '').toLowerCase().includes(q) ||
        (ad.vendorEmail || '').toLowerCase().includes(q) ||
        (ad.productName || '').toLowerCase().includes(q) ||
        (ad.paymentReference || '').toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [advertisements, statusFilter, searchQuery]);

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
      showToast(`✅ Advertisement for "${disableModal.ad.productName}" has been disabled.`);
    } else {
      showToast('❌ Failed to disable advertisement. Please try again.');
    }

    setIsDisabling(false);
    setDisableModal({ isOpen: false, ad: null });
    setDisableReason('');
  };

  // Move Advertisement (Active, Failed, Pending, Expired, Disabled) to Trash
  const handleMoveToTrash = async () => {
    if (!trashModal.ad) return;
    setIsProcessingAction(true);

    const targetAd = trashModal.ad;
    const originalStatus = targetAd.advertisementStatus.toUpperCase();
    const updated = await moveAdvertisementToTrash(targetAd);

    if (updated) {
      setAdvertisements((prev) =>
        prev.map((a) => (a.id === targetAd.id ? updated : a))
      );
      showToast(
        `🗑️ ${originalStatus} advertisement for "${targetAd.productName || 'Product'}" moved to Trash (auto-deletes in ${TRASH_RETENTION_DAYS} days).`
      );
    } else {
      showToast('❌ Failed to move advertisement to Trash.');
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
        `✨ Restored advertisement for "${ad.productName || 'Product'}" back to ${restored.advertisementStatus.toUpperCase()} status.`
      );
    } else {
      showToast('❌ Failed to restore advertisement.');
    }

    setIsProcessingAction(false);
  };

  // Permanent Delete Advertisement
  const handlePermanentDelete = async () => {
    if (!permanentDeleteModal.ad) return;
    setIsProcessingAction(true);

    const targetAd = permanentDeleteModal.ad;
    const success = await permanentlyDeleteAdvertisement(targetAd.id);

    if (success) {
      setAdvertisements((prev) => prev.filter((a) => a.id !== targetAd.id));
      showToast(`💥 Permanently deleted advertisement record for "${targetAd.productName || 'Product'}".`);
    } else {
      showToast('❌ Failed to permanently delete advertisement.');
    }

    setIsProcessingAction(false);
    setPermanentDeleteModal({ isOpen: false, ad: null });
  };

  // Empty Trash Bin
  const handleEmptyTrash = async () => {
    setIsProcessingAction(true);
    const count = await emptyTrashBin();

    setAdvertisements((prev) => prev.filter((a) => a.advertisementStatus !== 'trashed'));
    showToast(`🗑️ Emptied Trash Bin. Permanently purged ${count} advertisement records.`);

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
      showToast('Info: No expired or failed advertisement records to move to Trash.');
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

    showToast(`🗑️ Moved ${count} expired/failed advertisement record${count > 1 ? 's' : ''} to Trash.`);
    setIsProcessingAction(false);
  };

  // Permanently clear all pending and failed/cancelled records so only new ones stand
  const handleClearPendingAndFailed = async () => {
    setIsProcessingAction(true);
    const count = await clearPendingAndFailedAdvertisements();
    await loadAdvertisements();
    showToast(`💥 Permanently cleared ${count} pending and failed/cancelled advertisement records. Only new ones stand!`);
    setIsProcessingAction(false);
    setClearPendingFailedModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-white p-4 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            statusFilter === 'all'
              ? 'border-[#0F5132] ring-2 ring-[#0F5132]/20 shadow-sm scale-[1.01]'
              : 'border-[#E8E2D9] hover:border-[#0F5132]'
          }`}
        >
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Ads</span>
            <Megaphone className="w-4 h-4 text-[#0F5132]" />
          </div>
          <span className="text-2xl font-extrabold text-[#111827]">{stats.total}</span>
        </div>

        <div
          onClick={() => setStatusFilter('active')}
          className={`p-4 rounded-2xl border shadow-xs bg-gradient-to-br from-emerald-50/30 to-white cursor-pointer transition-all ${
            statusFilter === 'active'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm scale-[1.01]'
              : 'border-emerald-200 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-700">{stats.active}</span>
        </div>

        <div
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border shadow-xs bg-gradient-to-br from-amber-50/30 to-white cursor-pointer transition-all ${
            statusFilter === 'pending'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm scale-[1.01]'
              : 'border-amber-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-extrabold text-amber-700">{stats.pending}</span>
        </div>

        <div
          onClick={() => setStatusFilter('expired')}
          className={`bg-white p-4 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            statusFilter === 'expired'
              ? 'border-gray-500 ring-2 ring-gray-400/20 shadow-sm scale-[1.01]'
              : 'border-[#E8E2D9] hover:border-gray-400'
          }`}
        >
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Expired</span>
            <XCircle className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-2xl font-extrabold text-gray-500">{stats.expired}</span>
        </div>

        <div
          onClick={() => setStatusFilter('cancelled')}
          className={`p-4 rounded-2xl border shadow-xs bg-gradient-to-br from-red-50/30 to-white cursor-pointer transition-all ${
            statusFilter === 'cancelled'
              ? 'border-red-500 ring-2 ring-red-500/20 shadow-sm scale-[1.01]'
              : 'border-red-200 hover:border-red-400'
          }`}
        >
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Failed</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-2xl font-extrabold text-red-600">{stats.failed}</span>
        </div>

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
            <TrendingUp className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Total Advertising Revenue Collected</h4>
            <p className="text-2xl font-black text-white">{formatNaira(stats.totalRevenue)}</p>
          </div>
        </div>
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

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by vendor, product, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <Filter className="w-4 h-4 text-[#6B7280] shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AdvertisementStatus | 'all')}
            className="w-full sm:w-auto px-3 py-2 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132] font-semibold"
          >
            <option value="all">Standard List (Active, Pending, Expired, Disabled, Failed)</option>
            <option value="active">Active Ads ({stats.active})</option>
            <option value="pending">Pending Payment ({stats.pending})</option>
            <option value="expired">Expired Ads ({stats.expired})</option>
            <option value="disabled">Disabled Ads</option>
            <option value="cancelled">Cancelled / Failed ({stats.failed})</option>
            <option value="trashed">🗑️ Trash Bin ({stats.trashed})</option>
          </select>

          <button
            type="button"
            onClick={loadAdvertisements}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#0F5132] text-xs font-bold rounded-xl border border-[#C8E6C9] transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          {statusFilter === 'trashed' && stats.trashed > 0 && (
            <button
              type="button"
              onClick={() => setEmptyTrashModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
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
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-colors shrink-0"
              title="Move all expired and failed advertisement records to Trash Bin"
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
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition-colors shrink-0"
              title="Permanently clear all pending and failed/cancelled advertisement records"
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
              <h4 className="text-xs font-extrabold text-purple-900">Advertisement Trash Bin</h4>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Deleted advertisements stay in Trash for <strong>30 days</strong> before automatic permanent deletion. You can restore them anytime.
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

      {/* Advertisements Table */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#0F5132] animate-spin" />
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Megaphone className="w-10 h-10 text-[#D6CDC0] mx-auto mb-3" />
            <p className="text-sm font-bold text-[#4B5563]">
              {statusFilter === 'trashed' ? 'Trash Bin is empty' : 'No advertisements found'}
            </p>
            <p className="text-xs text-[#6B7280] mt-1">
              {statusFilter === 'trashed'
                ? 'Deleted advertisements will be retained here for 30 days.'
                : statusFilter !== 'all'
                ? 'Try changing the status filter.'
                : 'Vendors can create advertisements from their dashboard.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#E8F5E9] text-[#0F5132] font-bold border-b border-[#C8E6C9]">
                  <th className="p-3">Product</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">{statusFilter === 'trashed' ? 'Original / Trash Status' : 'Ad Status'}</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">{statusFilter === 'trashed' ? 'Auto-Purge Countdown' : 'Duration'}</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredAds.map((ad) => {
                  const daysRemaining = getDaysRemainingInTrash(ad.trashedAt);
                  const isTrashed = ad.advertisementStatus === 'trashed';
                  const previousStatus = ad.previousStatus || 'active';

                  return (
                    <tr key={ad.id} className={`hover:bg-[#FBF9F6] transition-colors ${isTrashed ? 'bg-purple-50/20' : ''}`}>
                      {/* Product */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {ad.productImage && (
                            <img
                              src={ad.productImage}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover border border-[#E8E2D9] shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <Link
                              to={`/product/${ad.productId}`}
                              className="font-bold text-[#111827] hover:text-[#0F5132] truncate block max-w-[140px]"
                            >
                              {ad.productName || 'Unknown Product'}
                            </Link>
                            {ad.productPrice && (
                              <span className="text-[10px] text-[#4B5563]">
                                {formatNaira(ad.productPrice)}{ad.productUnit ? ` / ${ad.productUnit}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Vendor */}
                      <td className="p-3">
                        <div className="min-w-0">
                          <span className="font-bold text-[#111827] block truncate max-w-[120px]">
                            {ad.vendorName || 'Unknown'}
                          </span>
                          <span className="text-[10px] text-[#4B5563] truncate block max-w-[120px]">
                            {ad.vendorEmail || ''}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-3 font-extrabold text-[#0F5132]">
                        {formatNaira(ad.amount)}
                      </td>

                      {/* Payment Status */}
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${PAYMENT_STATUS_CONFIG[ad.paymentStatus].bgColor} ${PAYMENT_STATUS_CONFIG[ad.paymentStatus].color}`}>
                          {PAYMENT_STATUS_CONFIG[ad.paymentStatus].label}
                        </span>
                      </td>

                      {/* Ad Status / Trash Badge */}
                      <td className="p-3">
                        {isTrashed ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border bg-purple-100 text-purple-800 border-purple-300">
                              <Trash2 className="w-3 h-3" />
                              <span>TRASHED</span>
                            </span>
                            <span className="block text-[10px] font-medium text-gray-500 capitalize">
                              Was: <strong>{previousStatus}</strong>
                            </span>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${AD_STATUS_CONFIG[ad.advertisementStatus].bgColor} ${AD_STATUS_CONFIG[ad.advertisementStatus].color} ${AD_STATUS_CONFIG[ad.advertisementStatus].borderColor}`}>
                            {AD_STATUS_CONFIG[ad.advertisementStatus].label}
                          </span>
                        )}
                      </td>

                      {/* Reference */}
                      <td className="p-3">
                        <span className="text-[10px] font-mono text-[#4B5563] truncate block max-w-[100px]" title={ad.paymentReference || ''}>
                          {ad.paymentReference || '—'}
                        </span>
                      </td>

                      {/* Duration / Auto-purge countdown */}
                      <td className="p-3 text-[10px] text-[#4B5563]">
                        {isTrashed ? (
                          <div className="inline-flex items-center gap-1 text-purple-700 font-bold bg-purple-100/60 px-2 py-1 rounded-lg border border-purple-200">
                            <Clock className="w-3 h-3 text-purple-600 shrink-0" />
                            <span>Purges in {daysRemaining} days</span>
                          </div>
                        ) : ad.startsAt ? (
                          <div>
                            <span className="block">{new Date(ad.startsAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}</span>
                            <span className="block text-[#6B7280]">
                              → {ad.expiresAt ? new Date(ad.expiresAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' }) : '—'}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/product/${ad.productId}`}
                            className="inline-flex items-center gap-1 text-[#0F5132] hover:text-[#0B3D26] font-bold bg-[#E8F5E9] hover:bg-[#C8E6C9] px-2 py-1 rounded-lg border border-[#C8E6C9] transition-colors"
                            title="View Product"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </Link>

                          {/* Trashed Item Actions */}
                          {isTrashed ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRestoreAd(ad)}
                                disabled={isProcessingAction}
                                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 transition-colors"
                                title={`Restore ad back to ${previousStatus}`}
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setPermanentDeleteModal({ isOpen: true, ad })}
                                disabled={isProcessingAction}
                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-bold bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg border border-red-200 transition-colors"
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
                                  className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 transition-colors"
                                  title="Disable Advertisement"
                                >
                                  <Ban className="w-3 h-3" />
                                  <span>Disable</span>
                                </button>
                              )}

                              {/* Move to Trash Button */}
                              <button
                                type="button"
                                onClick={() => setTrashModal({ isOpen: true, ad })}
                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-bold bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg border border-red-200 transition-colors"
                                title={`Move ${ad.advertisementStatus.toUpperCase()} advertisement to Trash`}
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

      {/* Disable Confirmation Modal */}
      {disableModal.isOpen && disableModal.ad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E8E2D9] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Ban className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#111827]">Disable Advertisement</h3>
                <p className="text-xs text-[#4B5563]">
                  "{disableModal.ad.productName}" by {disableModal.ad.vendorName}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#4B5563]">
              This will remove the product from the sponsored section. The vendor will not receive a refund. Please provide a reason.
            </p>

            <textarea
              value={disableReason}
              onChange={(e) => setDisableReason(e.target.value)}
              placeholder="Enter reason for disabling this advertisement..."
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
                <span>Disable Ad</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move to Trash Confirmation Modal (Explicitly indicates current advertisement status) */}
      {trashModal.isOpen && trashModal.ad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E8E2D9] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#111827]">Move Advertisement to Trash</h3>
                <p className="text-xs text-[#4B5563]">
                  "{trashModal.ad.productName || 'Produce Product'}"
                </p>
              </div>
            </div>

            {/* Explicit Status Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Target Ad Status: </span>
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
                <span className="text-gray-500">Vendor:</span>
                <span className="font-bold text-[#111827]">{trashModal.ad.vendorName || 'Unknown Vendor'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount:</span>
                <span className="font-bold text-[#0F5132]">{formatNaira(trashModal.ad.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reference:</span>
                <span className="font-mono text-[#0F5132] font-bold">{trashModal.ad.paymentReference || 'N/A'}</span>
              </div>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              This <strong>{trashModal.ad.advertisementStatus.toUpperCase()}</strong> advertisement will be moved to the Trash Bin. It will remain in Trash for <strong>30 days</strong>, allowing you to restore it anytime before automatic permanent deletion.
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
                onClick={handleMoveToTrash}
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
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#111827]">Permanently Purge Advertisement</h3>
                <p className="text-xs text-[#4B5563]">
                  "{permanentDeleteModal.ad.productName || 'Produce Product'}"
                </p>
              </div>
            </div>

            <p className="text-xs text-red-600 font-semibold leading-relaxed bg-red-50 p-3 rounded-xl border border-red-200">
              ⚠️ <strong>WARNING:</strong> This action cannot be undone! This advertisement record will be deleted permanently from the database immediately.
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
                onClick={handlePermanentDelete}
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
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#111827]">Empty Trash Bin</h3>
                <p className="text-xs text-[#4B5563]">Purge all trashed advertisements ({stats.trashed} items)</p>
              </div>
            </div>

            <p className="text-xs text-red-600 font-semibold leading-relaxed bg-red-50 p-3 rounded-xl border border-red-200">
              ⚠️ Are you sure you want to empty the Trash Bin? All <strong>{stats.trashed}</strong> trashed advertisement records will be permanently erased.
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
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#111827]">Clear Pending & Failed Ads</h3>
                <p className="text-xs text-[#4B5563]">Purge all old pending & failed records ({stats.pending + stats.failed} items)</p>
              </div>
            </div>

            <p className="text-xs text-red-600 font-semibold leading-relaxed bg-red-50 p-3 rounded-xl border border-red-200">
              ⚠️ Are you sure you want to permanently clear all <strong>{stats.pending + stats.failed}</strong> pending and failed/cancelled advertisement records? This leaves a clean slate so only new advertisements will stand.
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


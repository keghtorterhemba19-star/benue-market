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
} from 'lucide-react';
import type { Advertisement, AdvertisementStatus } from '../../types/advertisement';
import { AD_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '../../types/advertisement';
import { fetchAllAdvertisements, disableAdvertisement } from '../../services/advertisingService';
import { formatNaira } from '../../utils/formatters';
import { Link } from 'react-router-dom';

interface AdminAdvertisingTabProps {
  isSuperAdmin: boolean;
  showToast: (msg: string) => void;
}

export const AdminAdvertisingTab: React.FC<AdminAdvertisingTabProps> = ({
  isSuperAdmin,
  showToast,
}) => {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdvertisementStatus | 'all'>('all');
  const [disableModal, setDisableModal] = useState<{ isOpen: boolean; ad: Advertisement | null }>({
    isOpen: false,
    ad: null,
  });
  const [disableReason, setDisableReason] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);

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
    const failed = advertisements.filter((a) => a.paymentStatus === 'failed' || a.paymentStatus === 'cancelled').length;
    const totalRevenue = advertisements
      .filter((a) => a.paymentStatus === 'success')
      .reduce((sum, a) => sum + a.amount, 0);

    return { active, pending, expired, failed, totalRevenue, total: advertisements.length };
  }, [advertisements]);

  // Filtered list
  const filteredAds = useMemo(() => {
    return advertisements.filter((ad) => {
      const matchesStatus = statusFilter === 'all' || ad.advertisementStatus === statusFilter;
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

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs">
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Ads</span>
            <Megaphone className="w-4 h-4 text-[#0F5132]" />
          </div>
          <span className="text-2xl font-extrabold text-[#111827]">{stats.total}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-gradient-to-br from-emerald-50/30 to-white">
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-700">{stats.active}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-gradient-to-br from-amber-50/30 to-white">
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-extrabold text-amber-700">{stats.pending}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs">
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Expired</span>
            <XCircle className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-2xl font-extrabold text-gray-500">{stats.expired}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs bg-gradient-to-br from-red-50/30 to-white">
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Failed</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-2xl font-extrabold text-red-600">{stats.failed}</span>
        </div>

        <div className="bg-gradient-to-br from-[#0F5132] to-[#0B3D26] p-4 rounded-2xl border border-emerald-800 shadow-xs text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Revenue</span>
            <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <span className="text-2xl font-extrabold">{formatNaira(stats.totalRevenue)}</span>
        </div>
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#6B7280] shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AdvertisementStatus | 'all')}
            className="w-full sm:w-auto px-3 py-2 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending Payment</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
            <option value="cancelled">Cancelled / Failed</option>
          </select>

          <button
            type="button"
            onClick={loadAdvertisements}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#0F5132] text-xs font-bold rounded-xl border border-[#C8E6C9] transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Advertisements Table */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#0F5132] animate-spin" />
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Megaphone className="w-10 h-10 text-[#D6CDC0] mx-auto mb-3" />
            <p className="text-sm font-bold text-[#4B5563]">No advertisements found</p>
            <p className="text-xs text-[#6B7280] mt-1">
              {statusFilter !== 'all' ? 'Try changing the status filter.' : 'Vendors can create advertisements from their dashboard.'}
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
                  <th className="p-3">Ad Status</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-[#FBF9F6] transition-colors">
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

                    {/* Ad Status */}
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${AD_STATUS_CONFIG[ad.advertisementStatus].bgColor} ${AD_STATUS_CONFIG[ad.advertisementStatus].color} ${AD_STATUS_CONFIG[ad.advertisementStatus].borderColor}`}>
                        {AD_STATUS_CONFIG[ad.advertisementStatus].label}
                      </span>
                    </td>

                    {/* Reference */}
                    <td className="p-3">
                      <span className="text-[10px] font-mono text-[#4B5563] truncate block max-w-[100px]" title={ad.paymentReference || ''}>
                        {ad.paymentReference || '—'}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="p-3 text-[10px] text-[#4B5563]">
                      {ad.startsAt ? (
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

                        {isSuperAdmin && ad.advertisementStatus === 'active' && (
                          <button
                            type="button"
                            onClick={() => setDisableModal({ isOpen: true, ad })}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-bold bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg border border-red-200 transition-colors"
                            title="Disable Advertisement"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Disable</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-600" />
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
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-red-400 min-h-[80px] resize-none"
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
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl shadow-sm transition-colors inline-flex items-center justify-center gap-2"
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
    </div>
  );
};

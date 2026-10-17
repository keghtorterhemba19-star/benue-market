import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Crown,
  Zap,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Ban,
  Trash2,
  RotateCcw,
  Search,
} from 'lucide-react';
import type { Advertisement } from '../../types/advertisement';
import {
  formatNaira,
  formatSubscriptionDateTime,
  formatFullDateTimeWAT,
  getSubscriptionTimeDetails,
  generateTelLink,
  cleanNigerianPhoneForWhatsapp,
} from '../../utils/formatters';
import { Link } from 'react-router-dom';

interface SubscriptionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Advertisement | null;
  onFilterByUser?: (vendorNameOrId: string) => void;
  onDisable?: (ad: Advertisement) => void;
  onMoveToTrash?: (ad: Advertisement) => void;
  onRestore?: (ad: Advertisement) => void;
  onPermanentDelete?: (ad: Advertisement) => void;
}

export const SubscriptionDetailModal: React.FC<SubscriptionDetailModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onFilterByUser,
  onDisable,
  onMoveToTrash,
  onRestore,
  onPermanentDelete,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);

  if (!isOpen || !subscription) return null;

  const timeDetails = getSubscriptionTimeDetails(
    subscription.startsAt,
    subscription.expiresAt,
    subscription.advertisementStatus
  );

  const isGrowth = subscription.plan === 'growth' || subscription.amount === 5000;
  const isTrashed = subscription.advertisementStatus === 'trashed';
  const isActive = subscription.advertisementStatus === 'active';
  const isExpired = subscription.advertisementStatus === 'expired' || timeDetails.isExpired;

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const whatsappPhone = subscription.vendorPhone
    ? cleanNigerianPhoneForWhatsapp(subscription.vendorPhone)
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#0F5132] via-[#11623d] to-[#0B3D26] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              {isGrowth ? (
                <Crown className="w-5 h-5 text-[#FEAE3A]" />
              ) : (
                <Zap className="w-5 h-5 text-emerald-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Subscription Inspection</h3>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    isGrowth
                      ? 'bg-amber-400/20 text-[#FEAE3A] border-amber-300/40'
                      : 'bg-emerald-400/20 text-emerald-200 border-emerald-300/40'
                  }`}
                >
                  {isGrowth ? '★ Growth VIP Plan' : 'Starter Plan'}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                Verified administrative timeline & user subscription audit
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#374151]">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              isActive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : isExpired
                ? 'bg-gray-100 border-gray-300 text-gray-800'
                : isTrashed
                ? 'bg-purple-50 border-purple-200 text-purple-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : isExpired
                    ? 'bg-gray-400 text-white'
                    : isTrashed
                    ? 'bg-purple-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {isActive ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isExpired ? (
                  <XCircle className="w-5 h-5" />
                ) : isTrashed ? (
                  <Trash2 className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm uppercase tracking-wide">
                    {isActive
                      ? 'Active Produce Subscription'
                      : isExpired
                      ? 'Subscription Expired'
                      : isTrashed
                      ? 'Subscription Trashed'
                      : 'Pending Payment / Inactive'}
                  </span>
                  {isActive && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold opacity-90 mt-0.5">
                  {timeDetails.countdownText}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
                Billing Cycle
              </span>
              <span className="font-extrabold text-sm">30 Days Standard</span>
            </div>
          </div>

          {/* ACTIVE DATE & TIME vs EXPIRED DATE & TIME GRID */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0F5132]" />
              <span>Subscription Schedule (Date & Time Verification)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Active / Start Date & Time */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#0F5132] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5132]" />
                    <span>Active Subscription Started</span>
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-extrabold bg-emerald-100 text-emerald-800 rounded-md">
                    Start Timestamp
                  </span>
                </div>

                {subscription.startsAt ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[#111827] font-black text-base">
                      <Calendar className="w-4 h-4 text-[#0F5132]" />
                      <span>{timeDetails.startsAtFormatted.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-extrabold text-[#0F5132]">
                      <Clock className="w-3.5 h-3.5 text-[#0F5132]" />
                      <span>{timeDetails.startsAtFormatted.time || '12:00:00 AM'} (Local WAT)</span>
                    </div>
                    <p className="text-[10px] text-[#6B7280] font-medium pt-1 border-t border-[#E8E2D9]/60">
                      {formatFullDateTimeWAT(subscription.startsAt)}
                    </p>
                  </div>
                ) : (
                  <div className="py-2 text-[#6B7280] font-medium">
                    No activation timestamp recorded (pending verification).
                  </div>
                )}
              </div>

              {/* Expired / End Date & Time */}
              <div
                className={`p-4 rounded-2xl border space-y-2 ${
                  isExpired
                    ? 'bg-red-50/40 border-red-200'
                    : 'bg-[#FAF8F5] border-[#E8E2D9]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isExpired ? 'text-red-700' : 'text-[#B45309]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isExpired ? 'Subscription Expired At' : 'Expires At (Expiry Schedule)'}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md ${
                      isExpired
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isExpired ? 'Expired' : 'Expiry Timestamp'}
                  </span>
                </div>

                {subscription.expiresAt ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[#111827] font-black text-base">
                      <Calendar className="w-4 h-4 text-[#B45309]" />
                      <span>{timeDetails.expiresAtFormatted.date}</span>
                    </div>
                    <div
                      className={`flex items-center gap-2 text-xs font-extrabold ${
                        isExpired ? 'text-red-600' : 'text-[#B45309]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeDetails.expiresAtFormatted.time || '12:00:00 AM'} (Local WAT)</span>
                    </div>
                    <p className="text-[10px] text-[#6B7280] font-medium pt-1 border-t border-[#E8E2D9]/60">
                      {formatFullDateTimeWAT(subscription.expiresAt)}
                    </p>
                  </div>
                ) : (
                  <div className="py-2 text-[#6B7280] font-medium">
                    No expiration date set.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SUBSCRIBED USER PROFILE */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#0F5132]" />
                <span>Subscribed User & Vendor Account</span>
              </h4>

              {onFilterByUser && (subscription.vendorName || subscription.vendorId) && (
                <button
                  type="button"
                  onClick={() => {
                    onFilterByUser(subscription.vendorName || subscription.vendorId);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-[#0F5132] bg-[#E8F5E9] hover:bg-[#C8E6C9] rounded-lg border border-[#C8E6C9] transition-colors"
                  title="Search all subscriptions for this user on admin dashboard"
                >
                  <Search className="w-3 h-3" />
                  <span>Search User's Subscriptions</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0F5132] text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                  {(subscription.vendorName || 'U').charAt(0)}
                </div>
                <div>
                  <h5 className="font-black text-sm text-[#111827]">
                    {subscription.vendorName || 'Unknown Vendor'}
                  </h5>
                  <span className="text-[10px] text-[#6B7280] font-mono">
                    User/Vendor ID: {subscription.vendorId || '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {subscription.vendorEmail && (
                  <a
                    href={`mailto:${subscription.vendorEmail}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#E8E2D9] text-[#111827] font-bold rounded-xl border border-[#D6CDC0] transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#0F5132]" />
                    <span>{subscription.vendorEmail}</span>
                  </a>
                )}

                {subscription.vendorPhone && (
                  <>
                    <a
                      href={generateTelLink(subscription.vendorPhone)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#E8E2D9] text-[#111827] font-bold rounded-xl border border-[#D6CDC0] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#0F5132]" />
                      <span>{subscription.vendorPhone}</span>
                    </a>

                    {whatsappPhone && (
                      <a
                        href={`https://wa.me/${whatsappPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                        title="Open WhatsApp chat with farmer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* SUBSCRIBED PRODUCE LISTING */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] space-y-3">
            <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">
              Promoted Produce Listing
            </h4>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {subscription.productImage ? (
                  <img
                    src={subscription.productImage}
                    alt={subscription.productName || ''}
                    className="w-12 h-12 rounded-xl object-cover border border-[#E8E2D9] shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center font-bold text-gray-400 shrink-0">
                    BM
                  </div>
                )}
                <div>
                  <h5 className="font-black text-sm text-[#111827]">
                    {subscription.productName || 'Agricultural Produce'}
                  </h5>
                  <p className="text-[11px] text-[#4B5563] font-semibold mt-0.5">
                    {subscription.productPrice ? formatNaira(subscription.productPrice) : 'Price on inquiry'}
                    {subscription.productUnit ? ` / ${subscription.productUnit}` : ''}
                  </p>
                </div>
              </div>

              <Link
                to={`/product/${subscription.productId}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold rounded-xl transition-colors shrink-0 shadow-xs"
              >
                <span>View Listing</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* FINANCIAL & AUDIT INFORMATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-2">
              <h5 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                Financial Breakdown
              </h5>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Plan Subscription:</span>
                  <span className="font-black text-[#111827]">
                    {isGrowth ? 'Growth VIP (₦5,000)' : 'Starter Plan (₦2,000)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Total Amount Paid:</span>
                  <span className="font-black text-[#0F5132] text-sm">
                    {formatNaira(subscription.amount)} {subscription.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Payment Status:</span>
                  <span className="font-extrabold text-emerald-700 uppercase text-[10px]">
                    {subscription.paymentStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Gateway Provider:</span>
                  <span className="font-bold text-[#111827]">Paystack Live Integration</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-2">
              <h5 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                Transaction Reference & Audit
              </h5>
              <div className="space-y-1.5">
                <div>
                  <span className="text-[10px] text-[#6B7280] block mb-1">Payment Reference:</span>
                  <div className="flex items-center gap-1.5">
                    <code className="px-2 py-1 bg-white border border-[#D6CDC0] rounded-lg font-mono text-[11px] text-[#111827] flex-1 truncate">
                      {subscription.paymentReference || 'NO_REFERENCE'}
                    </code>
                    {subscription.paymentReference && (
                      <button
                        type="button"
                        onClick={() => handleCopyReference(subscription.paymentReference!)}
                        className="p-1.5 bg-white border border-[#D6CDC0] hover:bg-[#E8F5E9] rounded-lg transition-colors text-[#0F5132]"
                        title="Copy reference code"
                      >
                        {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-[#6B7280] space-y-0.5 pt-1">
                  <div>Created: {formatSubscriptionDateTime(subscription.createdAt, true)}</div>
                  <div>Updated: {formatSubscriptionDateTime(subscription.updatedAt, true)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E8E2D9] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {isActive && onDisable && (
              <button
                type="button"
                onClick={() => {
                  onDisable(subscription);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-200 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Disable Subscription</span>
              </button>
            )}

            {!isTrashed && onMoveToTrash && (
              <button
                type="button"
                onClick={() => {
                  onMoveToTrash(subscription);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 font-bold rounded-xl border border-gray-200 hover:border-red-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Move to Trash</span>
              </button>
            )}

            {isTrashed && onRestore && (
              <button
                type="button"
                onClick={() => {
                  onRestore(subscription);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Subscription</span>
              </button>
            )}

            {isTrashed && onPermanentDelete && (
              <button
                type="button"
                onClick={() => {
                  onPermanentDelete(subscription);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge Immediately</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#E8E2D9] hover:bg-[#D6CDC0] text-[#111827] font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

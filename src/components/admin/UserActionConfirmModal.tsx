import React, { useState } from 'react';
import { AlertTriangle, Trash2, Ban, CheckCircle, X } from 'lucide-react';
import type { User } from '../../types';

export type UserActionType = 'delete_vendor' | 'delete_buyer' | 'delete_admin' | 'suspend_user' | 'activate_user';

interface UserActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | null;
  actionType: UserActionType;
  onConfirm: (userId: string, reason?: string) => Promise<any>;
}

export const UserActionConfirmModal: React.FC<UserActionConfirmModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  actionType,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !targetUser) return null;

  const isDelete = actionType.startsWith('delete_');
  const isSuspend = actionType === 'suspend_user';


  const getTitle = () => {
    switch (actionType) {
      case 'delete_vendor':
        return `Delete Vendor: ${targetUser.name}`;
      case 'delete_buyer':
        return `Delete Buyer: ${targetUser.name}`;
      case 'delete_admin':
        return `Remove Admin: ${targetUser.name}`;
      case 'suspend_user':
        return `Suspend Account: ${targetUser.name}`;
      case 'activate_user':
        return `Reactivate Account: ${targetUser.name}`;
    }
  };

  const getWarning = () => {
    switch (actionType) {
      case 'delete_vendor':
        return 'This will permanently remove the farmer/vendor profile and disassociate or remove all their active produce listings from the Benue Marketplace. This action cannot be undone.';
      case 'delete_buyer':
        return 'This will permanently delete this buyer merchant profile, saved items, and inquiry records. This action cannot be undone.';
      case 'delete_admin':
        return 'This will revoke all administrative access and credentials for this staff member immediately.';
      case 'suspend_user':
        return 'Suspending this account will immediately block this user from logging in or creating listings on Benue Market until reactivated.';
      case 'activate_user':
        return 'Reactivating will restore full marketplace access and allow this user to log in and conduct trades.';
    }
  };

  const handleExecute = async () => {
    setError(null);
    setLoading(true);

    try {
      await onConfirm(targetUser.id, isSuspend ? (reason || 'Administrative policy enforcement') : undefined);
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] overflow-hidden">
        {/* Top Danger/Warning Bar */}
        <div
          className={`h-2 ${
            isDelete ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500' : isSuspend ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-gradient-to-r from-emerald-500 to-[#0F5132]'
          }`}
        />

        <div className="p-6 md:p-7 space-y-5">
          {/* Icon Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                  isDelete
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : isSuspend
                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}
              >
                {isDelete ? (
                  <Trash2 className="w-6 h-6" />
                ) : isSuspend ? (
                  <Ban className="w-6 h-6" />
                ) : (
                  <CheckCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <span
                  className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    isDelete
                      ? 'bg-red-50 text-red-800 border-red-200'
                      : isSuspend
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  Super Admin Executive Action
                </span>
                <h3 className="font-extrabold text-lg text-[#111827] mt-1 leading-tight">{getTitle()}</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Preview Card */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0F5132] text-white font-bold flex items-center justify-center shrink-0">
              {targetUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-[#111827] truncate">{targetUser.name}</p>
              <p className="text-xs text-[#6B7280] truncate">{targetUser.email} • {targetUser.lga || 'Benue'} LGA</p>
            </div>
          </div>

          {/* Warning Message */}
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              isDelete
                ? 'bg-red-50/70 border-red-200 text-red-900'
                : isSuspend
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}
          >
            <p className="font-semibold">{getWarning()}</p>
          </div>

          {/* Optional reason prompt for suspension */}
          {isSuspend && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827]">Suspension Reason (Visible to User)</label>
              <input
                type="text"
                placeholder="e.g. Inaccurate produce pricing / Unverified contact details"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132]"
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold text-[#374151] hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={loading}
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 ${
                isDelete
                  ? 'bg-red-600 hover:bg-red-700'
                  : isSuspend
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-[#0F5132] hover:bg-[#0B3D26]'
              }`}
            >
              {loading ? (
                <span>Processing...</span>
              ) : isDelete ? (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm Permanent Delete</span>
                </>
              ) : isSuspend ? (
                <>
                  <Ban className="w-4 h-4" />
                  <span>Suspend Account</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Reactivate Account</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

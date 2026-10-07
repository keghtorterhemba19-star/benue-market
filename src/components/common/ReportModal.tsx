import React, { useState } from 'react';
import { X, Flag, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { ReportReason } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'product' | 'seller';
  targetId: string;
  targetName: string;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS: { id: ReportReason; label: string; description: string; icon: string }[] = [
  {
    id: 'scam_fraud',
    label: 'Scam or Fraudulent Activity',
    description: 'Demanding advance payment without produce or deceptive banking details',
    icon: '🚨',
  },
  {
    id: 'fake_product',
    label: 'Fake or Non-Existent Product',
    description: 'Misleading photos, non-existent harvest batch, or stolen images',
    icon: '🚫',
  },
  {
    id: 'wrong_info',
    label: 'Wrong or Misleading Information',
    description: 'Inaccurate pricing, wrong weight/unit, or incorrect farm location/LGA',
    icon: '⚠️',
  },
  {
    id: 'offensive_seller',
    label: 'Offensive or Abusive Behavior',
    description: 'Unprofessional language, harassment, or verbal abuse',
    icon: '🤬',
  },
  {
    id: 'suspicious_seller',
    label: 'Suspicious or Unresponsive Seller',
    description: 'Refuses identity check or unverified seller details',
    icon: '🧐',
  },
  {
    id: 'duplicate_listing',
    label: 'Duplicate Produce Listing',
    description: 'Identical product posted multiple times to flood marketplace',
    icon: '📋',
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
  onReportSubmitted,
}) => {
  const { submitReport, currentUser } = useAuth();
  const [selectedReason, setSelectedReason] = useState<ReportReason>('scam_fraud');
  const [details, setDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState(currentUser?.email || '');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!details.trim()) {
      setError('Please provide specific details explaining your report.');
      return;
    }

    setLoading(true);
    try {
      await submitReport({
        targetType,
        targetId,
        targetName,
        reason: selectedReason,
        details,
        reporterEmail,
        reporterName: currentUser?.name || 'Benue User',
      });

      setIsSubmitted(true);
      if (onReportSubmitted) onReportSubmitted();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('scam_fraud');
    setDetails('');
    setIsSubmitted(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl w-full max-w-lg overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-red-700 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg text-white">
              <Flag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg">
                Report {targetType === 'product' ? 'Produce Item' : 'Seller / Farmer'}
              </h3>
              <p className="text-xs text-red-100 font-medium truncate max-w-[280px]">
                {targetName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {isSubmitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
                <CheckCircle2 className="w-10 h-10 text-[#0F5132]" />
              </div>
              <h4 className="font-extrabold text-xl text-[#111827]">Report Submitted</h4>
              <p className="text-xs text-[#4B5563] leading-relaxed max-w-sm mx-auto">
                Thank you for helping keep Benue Market safe. Our Super Administrator and security team will review your flag regarding <strong>{targetName}</strong> promptly.
              </p>
              <button
                onClick={handleClose}
                className="bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-6 py-3 rounded-xl shadow-sm transition-all"
              >
                Close & Return
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Submitting a report alerts platform administrators to investigate bad actors, fake listings, or policy breaches.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Select Reason */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-[#111827] uppercase tracking-wider block">
                  Select Violation Category *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.id}
                      onClick={() => setSelectedReason(r.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        selectedReason === r.id
                          ? 'border-red-600 bg-red-50/60 ring-2 ring-red-600/20'
                          : 'border-[#E8E2D9] bg-[#FAF8F5] hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={r.id}
                        checked={selectedReason === r.id}
                        onChange={() => setSelectedReason(r.id)}
                        className="mt-1 accent-red-600"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                          <span>{r.icon}</span>
                          <span>{r.label}</span>
                        </span>
                        <p className="text-[11px] text-[#6B7280] leading-normal">
                          {r.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Explanation Details */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#111827]">
                  Detailed Evidence / Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide specific details e.g. dates, phone conversation summary, mismatched pricing..."
                  className="w-full p-3 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                />
              </div>

              {/* Reporter Contact Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827]">
                  Your Contact Email (for status updates)
                </label>
                <input
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132]"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 text-xs font-bold text-[#4B5563] hover:text-[#111827]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{loading ? 'Submitting Flag...' : 'Submit Report'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

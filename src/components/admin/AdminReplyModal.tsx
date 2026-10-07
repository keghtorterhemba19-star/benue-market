import React, { useState } from 'react';
import { X, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import type { Report } from '../../types';

interface AdminReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
  onSendReply: (reportId: string, replyMessage: string) => Promise<void>;
}

const RESPONSE_TEMPLATES = [
  {
    title: 'Account Suspended Sanction',
    text: 'Thank you for reporting this issue. Our Super Administrator security team has investigated your complaint and suspended the reported seller account. Your report is now resolved.',
  },
  {
    title: 'Product Listing Removed',
    text: 'Thank you for your report. The flagged produce listing has been verified as inaccurate/misleading and has been deleted from the Benue Market directory.',
  },
  {
    title: 'Information Verified',
    text: 'We have reviewed your report regarding this listing. We contacted the vendor and verified their farm credentials. Thank you for helping keep Benue Market safe.',
  },
  {
    title: 'Under Investigation Note',
    text: 'Our administrative compliance team is actively monitoring this account. We will take appropriate security measures if further violations occur.',
  },
];

export const AdminReplyModal: React.FC<AdminReplyModalProps> = ({
  isOpen,
  onClose,
  report,
  onSendReply,
}) => {
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setLoading(true);
    try {
      await onSendReply(report.id, replyText.trim());
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReplyText('');
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl w-full max-w-lg overflow-hidden relative">
        {/* Header */}
        <div className="bg-[#0F5132] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg text-[#FEAE3A]">
              <MessageSquare className="w-5 h-5 text-[#FEAE3A]" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg">Send Executive Admin Response</h3>
              <p className="text-xs text-[#C8E6C9] truncate max-w-[260px]">
                Complainant: {report.reporterName || 'Anonymous User'} ({report.reporterEmail || 'N/A'})
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

        {/* Content */}
        <div className="p-6 md:p-8 space-y-5">
          {submitted ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#E8F5E9] text-[#10B981] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
              </div>
              <h4 className="font-extrabold text-lg text-[#111827]">Response Sent & Report Resolved</h4>
              <p className="text-xs text-[#4B5563] max-w-sm mx-auto">
                Your official administrative response has been logged and sent to <strong>{report.reporterName || 'complainant'}</strong>.
              </p>
              <button
                onClick={handleClose}
                className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Report Context Card */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8E2D9] text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span className="font-bold text-[#0F5132] uppercase">
                    Target: {report.targetName} ({report.targetType})
                  </span>
                  <span>Reason: {report.reason}</span>
                </div>
                <p className="text-[#374151] italic mt-1">"{report.details}"</p>
              </div>

              {/* Quick Template Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#111827]">Quick Response Templates:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {RESPONSE_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReplyText(tmpl.text)}
                      className="p-2 text-left bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[11px] font-bold text-[#0F5132] transition-colors truncate"
                    >
                      + {tmpl.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827]">Official Executive Response Message:</label>
                <textarea
                  required
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official administrative message or resolution details..."
                  className="w-full p-3 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132]"
                />
              </div>

              {/* Actions */}
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
                  className="bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Sending Response...' : 'Send Response & Resolve'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReplyModal;

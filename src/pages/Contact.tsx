import React, { useState } from 'react';
import { Phone, MapPin, MessageSquare, CheckCircle2, HelpCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Contact: React.FC = () => {
  const { submitReport, currentUser } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    message: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await submitReport({
        targetType: 'seller',
        targetId: 'support-inquiry',
        targetName: 'General Support & Complaints',
        reason: 'other',
        details: formData.message,
        reporterName: formData.name,
        reporterEmail: formData.email,
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#FBF9F6] min-h-screen py-8 md:py-16">
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider bg-[#FEF3C7] px-3 py-1 rounded-full border border-[#FDE68A]">
            Help & Support
          </span>
          <h1 className="font-extrabold text-3xl text-[#111827] tracking-tight">
            Contact Benue Market Support
          </h1>
          <p className="text-xs md:text-sm text-[#4B5563]">
            Have questions about listing produce, farmer verification, or finding specific agricultural commodities in Benue State? Reach out below.
          </p>
        </div>

        {/* Form & Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Form */}
          <div className="md:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-[#111827]">Send Us a Message</h3>

            {submitted ? (
              <div className="bg-[#E8F5E9] p-6 rounded-xl text-center space-y-2 text-[#0F5132] border border-[#C8E6C9]">
                <CheckCircle2 className="w-10 h-10 mx-auto" />
                <h4 className="font-bold text-base">Message Sent Successfully!</h4>
                <p className="text-xs text-[#4B5563]">
                  Thank you for reaching out. A Benue Market support team member will respond shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#111827]">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Terver Ortom"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#111827]">Email Address / Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. terver@gmail.com or 0803..."
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#111827]">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can we assist you with Benue Market?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold text-sm py-3 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting Message...' : 'Send Support Message'}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Support Details */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
              <h3 className="font-bold text-base text-[#111827]">Direct Contact Info</h3>

              <div className="space-y-3 text-xs text-[#4B5563]">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#111827]">Headquarters Office</strong>
                    <span>Makurdi Agricultural Hub, Benue State, Nigeria</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#111827]">Support Helpline</strong>
                    <span>+234 800 BENUE MKT (+234 800 236 836)</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[#111827]">WhatsApp Support</strong>
                    <span>+234 803 123 4567</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Card */}
            <div className="bg-[#E8F5E9] p-5 rounded-2xl border border-[#C8E6C9] space-y-2 text-xs text-[#0F5132]">
              <div className="flex items-center gap-1.5 font-bold">
                <HelpCircle className="w-4 h-4 text-[#0F5132]" />
                <span>Frequently Asked Question</span>
              </div>
              <p className="text-[#4B5563] text-[11px] leading-relaxed">
                <strong>Does Benue Market charge transaction fees?</strong> No, Benue Market is a free direct-connection marketplace. Buyers and sellers agree on price and deal terms directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

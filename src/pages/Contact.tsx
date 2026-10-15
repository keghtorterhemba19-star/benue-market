import React, { useState } from 'react';
import {
  Phone,
  PhoneCall,
  MapPin,
  MessageSquare,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Send,
  Store,
  ShoppingBag,
  Copy,
  Check,
  Clock,
  Headphones,
  Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SupportTicketModal } from '../components/common/SupportTicketModal';
import type { SupportTicket, TicketTopic } from '../types';

export const Contact: React.FC = () => {
  const { createSupportTicket, currentUser } = useAuth();
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);
  const [isHelpDeskModalOpen, setIsHelpDeskModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || currentUser?.whatsapp || '',
    topic: 'general_inquiry' as TicketTopic,
    message: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const setAudiencePreset = (role: 'farmer' | 'buyer') => {
    if (role === 'farmer') {
      setFormData((prev) => ({
        ...prev,
        topic: 'produce_listing',
        message: prev.message || 'Hello, I am a farmer in Benue State and need assistance with listing produce / account verification.',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        topic: 'buyer_orders_logistics',
        message: prev.message || 'Hello, I am a produce buyer looking for assistance with verified farmers / bulk agro orders.',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await createSupportTicket({
        submitterName: formData.name.trim(),
        submitterEmail: formData.email.trim(),
        submitterPhone: formData.phone.trim() || '+234 800 000 0000',
        submitterRole: currentUser?.role === 'seller' ? 'farmer' : 'buyer',
        topic: formData.topic,
        priority: 'medium',
        subject: `Contact inquiry from ${formData.name.trim()}`,
        message: formData.message.trim(),
        userId: currentUser?.id,
      });

      setSubmittedTicket(ticket);
    } catch (err: any) {
      setError(err.message || 'Failed to send support ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#FBF9F6] min-h-screen py-8 md:py-16">
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#E8F5E9] text-[#0F5132] px-3.5 py-1.5 rounded-full border border-[#C8E6C9] shadow-2xs">
            <Headphones className="w-4 h-4 text-[#FEAE3A]" />
            <span className="text-xs font-extrabold uppercase tracking-wider">
              24/7 Agro Support & Contact Hub
            </span>
          </div>
          <h1 className="font-extrabold text-3xl md:text-4xl text-[#111827] tracking-tight">
            Contact Benue Market Support
          </h1>
          <p className="text-xs md:text-sm text-[#4B5563] leading-relaxed">
            Direct operational support, helpline contacts, and ticket dispatch for Farmers, Cooperatives, and Commodity Buyers across all 23 Benue LGAs.
          </p>
        </div>

        {/* Farmer & Buyer Dual Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: For Farmers */}
          <div className="bg-gradient-to-br from-white to-[#F0FFF4] p-5 rounded-3xl border border-[#C8E6C9] shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#0F5132] text-white flex items-center justify-center shadow-xs">
                  <Store className="w-5 h-5 text-[#FEAE3A]" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#0F5132] border border-[#C8E6C9]">
                  Farmer Services
                </span>
              </div>
              <h3 className="font-extrabold text-base text-[#111827]">
                Are you a Benue Farmer or Cooperative?
              </h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Need help listing your harvest, verifying your Farmgate Producer Badge, solving pricing queries, or connecting with wholesale off-takers?
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAudiencePreset('farmer')}
                className="flex-1 py-2 px-3 bg-[#0F5132] hover:bg-[#0A3622] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Fill Farmer Inquiry</span>
              </button>
              <a
                href="https://wa.me/2348140001234?text=Hello%20Benue%20Market%20Support%2C%20I%20am%20a%20farmer%20and%20need%20assistance."
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 bg-white hover:bg-emerald-50 text-[#0F5132] text-xs font-bold rounded-xl border border-[#C8E6C9] transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Card 2: For Buyers */}
          <div className="bg-gradient-to-br from-white to-[#FFFBEB] p-5 rounded-3xl border border-[#FEAE3A]/40 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#B45309] text-white flex items-center justify-center shadow-xs">
                  <ShoppingBag className="w-5 h-5 text-[#FEF3C7]" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                  Buyer Services
                </span>
              </div>
              <h3 className="font-extrabold text-base text-[#111827]">
                Are you a Commodity Buyer or Merchant?
              </h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Need verification of a farmer listing, bulk haulage from Zaki Biam / Makurdi depots, escrow guidance, or to report a transaction issue?
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAudiencePreset('buyer')}
                className="flex-1 py-2 px-3 bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Fill Buyer Inquiry</span>
              </button>
              <a
                href="tel:+2348140001234"
                className="py-2 px-3 bg-white hover:bg-amber-50 text-[#B45309] text-xs font-bold rounded-xl border border-[#FDE68A] transition-colors flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Call Hotline</span>
              </a>
            </div>
          </div>
        </div>

        {/* Form & Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Form */}
          <div className="md:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-[#111827]">Submit an Inquiry</h3>
              <button
                type="button"
                onClick={() => setIsHelpDeskModalOpen(true)}
                className="text-xs font-bold text-[#0F5132] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FEAE3A]" />
                <span>Interactive Help Desk Portal →</span>
              </button>
            </div>

            {submittedTicket ? (
              <div className="bg-[#E8F5E9] p-6 rounded-2xl text-center space-y-3 text-[#0F5132] border border-[#C8E6C9] animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 mx-auto text-[#0F5132]" />
                <h4 className="font-black text-lg">Support Ticket #{submittedTicket.id} Created!</h4>
                <p className="text-xs text-[#4B5563] max-w-sm mx-auto">
                  Your inquiry has been assigned ticket ID <strong>#{submittedTicket.id}</strong> and dispatched to our Super Admin Help Desk.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedTicket(null);
                      setFormData({ ...formData, message: '' });
                    }}
                    className="text-xs font-bold bg-[#0F5132] text-white px-4 py-2 rounded-xl shadow-xs hover:bg-[#0B3D26]"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
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
                  <label className="text-xs font-bold text-[#111827]">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Terver Ortom"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#111827]">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="terver@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#111827]">Phone Number / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#111827]">Inquiry Message *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can we assist you with Benue Market (produce listing, subscriptions, verification, pricing, or orders)?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold text-sm py-3 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-[#FEAE3A]" />
                  <span>{submitting ? 'Creating Support Ticket...' : 'Send Inquiry Ticket'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Office & Help Desk Channels */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white border border-[#E8E2D9] p-6 rounded-3xl shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
                <h4 className="font-extrabold text-sm text-[#111827] uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#0F5132]" />
                  <span>Official Support Channels</span>
                </h4>
                <div className="flex items-center gap-1.5 bg-[#E8F5E9] text-[#0F5132] px-2 py-0.5 rounded-full text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active Desk</span>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Phone 1 */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] text-[#0F5132] flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-[#111827]">+234 814 000 1234</p>
                      <p className="text-[10px] text-[#6B7280]">Makurdi Central Hotline</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy('+2348140001234', 'pagePhone1')}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-[#0F5132] hover:bg-emerald-50"
                      title="Copy number"
                    >
                      {copiedKey === 'pagePhone1' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href="tel:+2348140001234"
                      className="px-2.5 py-1 bg-[#0F5132] hover:bg-[#0A3622] text-white text-[11px] font-bold rounded-lg transition-colors"
                    >
                      Call
                    </a>
                  </div>
                </div>

                {/* Phone 2 */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-[#111827]">+234 802 000 5678</p>
                      <p className="text-[10px] text-[#6B7280]">Zaki Biam Yam Depot Desk</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy('+2348020005678', 'pagePhone2')}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-[#B45309] hover:bg-amber-50"
                      title="Copy number"
                    >
                      {copiedKey === 'pagePhone2' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href="tel:+2348020005678"
                      className="px-2.5 py-1 bg-[#B45309] hover:bg-[#92400E] text-white text-[11px] font-bold rounded-lg transition-colors"
                    >
                      Call
                    </a>
                  </div>
                </div>

                {/* WhatsApp Chat */}
                <a
                  href="https://wa.me/2348140001234?text=Hello%20Benue%20Market%20Support%2C%20I%20am%20reaching%20out%20for%20assistance."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-[#0F5132] flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-xs">Official WhatsApp Support</p>
                      <p className="text-[10px] text-[#0F5132]/80">Instant Live Chat & Media</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold underline">Open Chat →</span>
                </a>

                {/* Email */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 text-[#374151] flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="font-extrabold text-xs text-[#111827] truncate">support@benuemarket.ng</p>
                      <p className="text-[10px] text-[#6B7280]">Official Inquiries & Tickets</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('support@benuemarket.ng', 'pageEmail')}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-[#0F5132] hover:bg-emerald-50 shrink-0"
                    title="Copy email"
                  >
                    {copiedKey === 'pageEmail' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Physical Hubs & Operating Hours */}
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[#111827]">Operational Ag-Depots:</strong>
                      <span className="text-[#4B5563] text-[11px]">
                        Wadata Market Hub, Makurdi & International Yam Market, Zaki Biam, Benue State
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D9] text-[11px] text-[#6B7280]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#FEAE3A]" />
                      <span>Mon – Sat: 7:00 AM – 7:00 PM (WAT)</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Open Now
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setIsHelpDeskModalOpen(true)}
                  className="w-full bg-[#0F5132] hover:bg-[#0A3622] text-white font-extrabold text-xs py-3 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-[#FEAE3A]" />
                  <span>Launch Live Help Desk Modal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SupportTicketModal
        isOpen={isHelpDeskModalOpen}
        onClose={() => setIsHelpDeskModalOpen(false)}
      />
    </div>
  );
};

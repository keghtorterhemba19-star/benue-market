import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Loader2,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { TicketTopic, TicketPriority, SupportTicket } from '../../types';
import {
  TICKET_TOPIC_CONFIG,
  TICKET_PRIORITY_CONFIG,
  TICKET_STATUS_CONFIG,
} from '../../types/support';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTopic?: TicketTopic;
  defaultSubject?: string;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  isOpen,
  onClose,
  defaultTopic = 'general_inquiry',
  defaultSubject = '',
}) => {
  const { currentUser, tickets, createSupportTicket } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [submitterName, setSubmitterName] = useState(currentUser?.name || '');
  const [submitterEmail, setSubmitterEmail] = useState(currentUser?.email || '');
  const [submitterPhone, setSubmitterPhone] = useState(currentUser?.phone || currentUser?.whatsapp || '');
  const [submitterRole, setSubmitterRole] = useState<'farmer' | 'buyer' | 'cooperative' | 'trader' | 'guest'>(
    currentUser?.role === 'seller' ? 'farmer' : (currentUser?.role === 'buyer' ? 'buyer' : 'farmer')
  );
  const [topic, setTopic] = useState<TicketTopic>(defaultTopic);
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<SupportTicket | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter user's own tickets
  const myTickets = tickets.filter(
    (t) =>
      (currentUser && t.userId === currentUser.id) ||
      (currentUser && t.submitterEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
      (submitterEmail && t.submitterEmail.toLowerCase() === submitterEmail.trim().toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!submitterName.trim()) {
      setFormError('Please enter your full name');
      return;
    }
    if (!submitterEmail.trim() || !submitterEmail.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }
    if (!submitterPhone.trim()) {
      setFormError('Please provide a contact phone number or WhatsApp number');
      return;
    }
    if (!subject.trim()) {
      setFormError('Please enter a brief subject or inquiry headline');
      return;
    }
    if (!message.trim() || message.trim().length < 15) {
      setFormError('Please provide more details in your inquiry (minimum 15 characters)');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await createSupportTicket({
        submitterName: submitterName.trim(),
        submitterEmail: submitterEmail.trim(),
        submitterPhone: submitterPhone.trim(),
        submitterRole,
        topic,
        priority,
        subject: subject.trim(),
        message: message.trim(),
        userId: currentUser?.id,
      });

      setCreatedTicket(ticket);
      setMessage('');
      setSubject('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F5132] via-[#115433] to-[#0B3D26] text-white p-6 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEAE3A] flex items-center justify-center shadow-md shrink-0">
              <HelpCircle className="w-5 h-5 text-[#0F5132]" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg leading-tight">Benue Market Support & Help Desk</h2>
              <p className="text-xs text-emerald-200">
                Direct inquiry channel for Farmers, Buyers, Cooperatives & Merchants
              </p>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15">
            <button
              type="button"
              onClick={() => {
                setActiveTab('create');
                setCreatedTicket(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'create'
                  ? 'bg-white text-[#0F5132] shadow-sm'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              Submit New Inquiry
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-[#0F5132] shadow-sm'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span>My Inquiries ({myTickets.length})</span>
              {myTickets.some((t) => t.status === 'open' || t.status === 'in_progress') && (
                <span className="w-2 h-2 rounded-full bg-[#FEAE3A] animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'create' ? (
            createdTicket ? (
              /* Success State */
              <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 text-[#0F5132] flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-9 h-9 text-[#0F5132]" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-xl text-[#0F5132]">Support Ticket Received!</h3>
                  <p className="text-xs text-gray-600 max-w-md mx-auto">
                    Your inquiry has been submitted directly to the Super Admin help desk. We typically respond within 2 to 4 business hours.
                  </p>
                </div>

                <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-4 text-left space-y-2 text-xs max-w-md mx-auto">
                  <div className="flex justify-between border-b border-[#E8E2D9] pb-2">
                    <span className="text-gray-500">Ticket ID:</span>
                    <span className="font-mono font-bold text-[#0F5132]">#{createdTicket.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E8E2D9] pb-2">
                    <span className="text-gray-500">Topic:</span>
                    <span className="font-bold text-[#111827]">
                      {TICKET_TOPIC_CONFIG[createdTicket.topic]?.label || createdTicket.topic}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#E8E2D9] pb-2">
                    <span className="text-gray-500">Priority:</span>
                    <span className="font-bold uppercase text-[#B45309]">{createdTicket.priority}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E8E2D9] pb-2">
                    <span className="text-gray-500">Status:</span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Open (Pending Review)
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="text-gray-500 block mb-1">Subject:</span>
                    <p className="font-semibold text-gray-900">{createdTicket.subject}</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="bg-[#0F5132] hover:bg-[#0B3D26] text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition-all"
                  >
                    Track Ticket & Replies
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatedTicket(null)}
                    className="bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs px-5 py-3 rounded-xl border border-gray-200 transition-all"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              /* Create Ticket Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-700 font-medium">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Submitter Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={submitterName}
                        onChange={(e) => setSubmitterName(e.target.value)}
                        placeholder="e.g. Terhemba Keghtor"
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0F5132]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Role on Benue Market *
                    </label>
                    <select
                      value={submitterRole}
                      onChange={(e) => setSubmitterRole(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0F5132]"
                    >
                      <option value="farmer">🌾 Farmer / Agro Producer</option>
                      <option value="cooperative">🤝 Farmers Cooperative Hub</option>
                      <option value="buyer">🛒 Wholesale / Retail Buyer</option>
                      <option value="trader">📦 Produce Merchant / Trader</option>
                      <option value="guest">👤 Guest Visitor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={submitterEmail}
                        onChange={(e) => setSubmitterEmail(e.target.value)}
                        placeholder="farmer@example.com"
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0F5132]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Phone Number / WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={submitterPhone}
                        onChange={(e) => setSubmitterPhone(e.target.value)}
                        placeholder="+234 800 000 0000"
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0F5132]"
                      />
                    </div>
                  </div>
                </div>

                {/* Topic & Priority Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Inquiry Topic / Category *
                    </label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value as TicketTopic)}
                      className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0F5132]"
                    >
                      {Object.entries(TICKET_TOPIC_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Inquiry Priority *
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TicketPriority)}
                      className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0F5132]"
                    >
                      <option value="low">Low (General question)</option>
                      <option value="medium">Medium (Standard inquiry)</option>
                      <option value="high">High (Trade / Verification active)</option>
                      <option value="urgent">Urgent (Payment or Disputed trade)</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Subject / Headline *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Inquiring about Starter & Growth produce subscription plans"
                    required
                    className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0F5132]"
                  />
                </div>

                {/* Inquiry Message */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                      Inquiry Message Body *
                    </label>
                    <span className="text-[10px] text-gray-400">
                      {message.length} characters (min 15)
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your inquiry, requested information, produce details, or situation clearly..."
                    required
                    className="w-full p-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0F5132] leading-relaxed resize-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0F5132]" />
                    <span>Protected by Super Admin Desk</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 bg-[#0F5132] hover:bg-[#0B3D26] disabled:bg-gray-400 text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-md transition-all active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Ticket...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-[#FEAE3A]" />
                        <span>Submit Support Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* User Ticket History Tab */
            <div className="space-y-4">
              {myTickets.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E8E2D9] p-6">
                  <HelpCircle className="w-10 h-10 text-gray-400 mx-auto" />
                  <p className="text-xs text-gray-600 font-semibold">
                    You haven't submitted any inquiries yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="text-xs font-bold text-[#0F5132] hover:underline"
                  >
                    Click here to open your first inquiry ticket →
                  </button>
                </div>
              ) : (
                myTickets.map((t) => {
                  const statusConf = TICKET_STATUS_CONFIG[t.status] || TICKET_STATUS_CONFIG.open;
                  const priorityConf = TICKET_PRIORITY_CONFIG[t.priority] || TICKET_PRIORITY_CONFIG.medium;
                  const topicConf = TICKET_TOPIC_CONFIG[t.topic] || TICKET_TOPIC_CONFIG.general_inquiry;

                  return (
                    <div
                      key={t.id}
                      className="bg-white border border-[#E8E2D9] rounded-2xl p-4 space-y-3 shadow-xs hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-[#0F5132]">
                            #{t.id}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusConf.bgColor} ${statusConf.color} ${statusConf.borderColor}`}>
                            {statusConf.label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${priorityConf.bgColor} ${priorityConf.color} ${priorityConf.borderColor}`}>
                            {priorityConf.label}
                          </span>
                        </div>

                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(t.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </span>
                      </div>

                      <div>
                        <div className="text-[11px] font-bold text-[#B45309] uppercase tracking-wider mb-0.5">
                          {topicConf.label}
                        </div>
                        <h4 className="font-bold text-sm text-gray-900">{t.subject}</h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-gray-100">
                          {t.message}
                        </p>
                      </div>

                      {/* Admin Replies Thread */}
                      {t.replies && t.replies.length > 0 ? (
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                          <div className="text-[11px] font-extrabold text-[#0F5132] flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Executive Response from Administration:</span>
                          </div>
                          {t.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="bg-[#E8F5E9]/60 border border-[#C8E6C9] rounded-xl p-3 text-xs space-y-1"
                            >
                              <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold">
                                <span className="font-bold text-[#0F5132]">{reply.senderName}</span>
                                <span>{new Date(reply.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-gray-800 font-medium leading-relaxed">
                                {reply.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60">
                          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Under review by the Super Admin Help Desk. An executive response will appear here once handled.</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

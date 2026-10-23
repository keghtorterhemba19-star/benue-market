import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  Phone,
  Mail,
  Trash2,
  Check,
  Copy,
  ShieldCheck,
  Store,
  ShoppingBag,
  X,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { SupportTicket, TicketStatus, TicketPriority } from '../../types';
import {
  TICKET_TOPIC_CONFIG,
  TICKET_PRIORITY_CONFIG,
  TICKET_STATUS_CONFIG,
} from '../../types/support';

interface AdminSupportTabProps {
  isSuperAdmin: boolean;
  showToast: (msg: string) => void;
}

export const AdminSupportTab: React.FC<AdminSupportTabProps> = ({
  isSuperAdmin,
  showToast,
}) => {
  const { tickets, updateTicketStatus, replyToTicket, deleteSupportTicket } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [adminNoteText, setAdminNoteText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Compute stats
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'open').length;
    const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
    const resolved = tickets.filter((t) => t.status === 'resolved').length;
    const urgent = tickets.filter((t) => t.priority === 'urgent' && t.status !== 'resolved').length;
    const farmers = tickets.filter((t) => t.submitterRole === 'farmer' || t.submitterRole === 'cooperative').length;
    const buyers = tickets.filter((t) => t.submitterRole === 'buyer' || t.submitterRole === 'trader').length;

    return { total, open, inProgress, resolved, urgent, farmers, buyers };
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Status filter
      if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;

      // Role filter
      if (roleFilter !== 'all' && ticket.submitterRole !== roleFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = ticket.id.toLowerCase().includes(q);
        const matchName = ticket.submitterName.toLowerCase().includes(q);
        const matchEmail = ticket.submitterEmail.toLowerCase().includes(q);
        const matchPhone = ticket.submitterPhone.toLowerCase().includes(q);
        const matchSubject = ticket.subject.toLowerCase().includes(q);
        const matchMessage = ticket.message.toLowerCase().includes(q);
        return matchId || matchName || matchEmail || matchPhone || matchSubject || matchMessage;
      }

      return true;
    });
  }, [tickets, statusFilter, priorityFilter, roleFilter, searchQuery]);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    await updateTicketStatus(ticketId, newStatus);
    showToast(`✅ Ticket #${ticketId} status updated to ${newStatus.toUpperCase()}`);
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !ticketReplyText.trim()) return;
    setIsReplying(true);
    try {
      await replyToTicket(
        selectedTicket.id,
        ticketReplyText.trim(),
        isSuperAdmin ? 'super_admin' : 'admin'
      );

      if (adminNoteText.trim()) {
        await updateTicketStatus(selectedTicket.id, selectedTicket.status, adminNoteText.trim());
      }

      showToast(`✅ Reply sent to ${selectedTicket.submitterName}`);
      setTicketReplyText('');
      setAdminNoteText('');

      // Refresh selected ticket in modal
      const updated = tickets.find((t) => t.id === selectedTicket.id);
      if (updated) {
        setSelectedTicket(updated);
      } else {
        setSelectedTicket(null);
      }
    } catch {
      showToast('❌ Failed to dispatch reply. Please try again.');
    } finally {
      setIsReplying(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSuperAdmin) {
      showToast('❌ Only the Super Administrator has permission to delete support tickets.');
      return;
    }
    if (window.confirm(`Are you sure you want to dismiss and delete Support Ticket #${ticketId}?`)) {
      await deleteSupportTicket(ticketId);
      showToast(`🗑️ Ticket #${ticketId} dismissed.`);
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* ── TOP EXECUTIVE BANNER & KPI METRICS ── */}
      <div className="bg-gradient-to-r from-[#0F5132] via-[#115433] to-[#0B3D26] text-white p-6 rounded-3xl shadow-lg border border-[#C8E6C9]/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_center,rgba(254,174,58,0.15)_0,transparent_70%)] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#FEAE3A]/20 border border-[#FEAE3A]/40 px-3 py-1 rounded-full text-xs font-black text-[#FEAE3A] uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Admin Help Desk Central</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Support & Inquiries Management</h2>
            <p className="text-xs text-emerald-200 mt-1 max-w-xl">
              Monitor, review, and resolve inquiries from farmers and buyers across Benue State. Control tickets with priority triage, status tracking, and direct contact channels.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-200 font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
              Total Recorded: <strong className="text-white text-sm">{stats.total}</strong>
            </span>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          {/* Card 1: Open */}
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/15">
            <span className="text-[11px] font-bold text-amber-300 block uppercase tracking-wider">
              Open (Pending)
            </span>
            <div className="text-2xl font-black text-white mt-1 flex items-center justify-between">
              <span>{stats.open}</span>
              {stats.open > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />}
            </div>
            <p className="text-[10px] text-emerald-200 mt-0.5">Awaiting staff review</p>
          </div>

          {/* Card 2: In Progress */}
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/15">
            <span className="text-[11px] font-bold text-blue-300 block uppercase tracking-wider">
              In Progress
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {stats.inProgress}
            </div>
            <p className="text-[10px] text-emerald-200 mt-0.5">Under active handling</p>
          </div>

          {/* Card 3: Resolved */}
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/15">
            <span className="text-[11px] font-bold text-emerald-300 block uppercase tracking-wider">
              Resolved
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {stats.resolved}
            </div>
            <p className="text-[10px] text-emerald-200 mt-0.5">Successfully closed</p>
          </div>

          {/* Card 4: Urgent */}
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/15">
            <span className="text-[11px] font-bold text-rose-300 block uppercase tracking-wider">
              Urgent Priority
            </span>
            <div className="text-2xl font-black text-rose-300 mt-1">
              {stats.urgent}
            </div>
            <p className="text-[10px] text-emerald-200 mt-0.5">Needs rapid reply</p>
          </div>

          {/* Card 5: Farmers */}
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/15">
            <span className="text-[11px] font-bold text-amber-200 block uppercase tracking-wider">
              Farmer Inquiries
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {stats.farmers}
            </div>
            <p className="text-[10px] text-emerald-200 mt-0.5">Agro & co-op requests</p>
          </div>

          {/* Card 6: Buyers */}
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/15">
            <span className="text-[11px] font-bold text-emerald-200 block uppercase tracking-wider">
              Buyer Inquiries
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {stats.buyers}
            </div>
            <p className="text-[10px] text-emerald-200 mt-0.5">Orders & logistics</p>
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH CONTROLS ── */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket ID, submitter, subject, phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0F5132]"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-[#0F5132]"
            >
              <option value="all">All Statuses ({tickets.length})</option>
              <option value="open">Open ({stats.open})</option>
              <option value="in_progress">In Progress ({stats.inProgress})</option>
              <option value="resolved">Resolved ({stats.resolved})</option>
              <option value="closed">Closed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-3 py-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-[#0F5132]"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="medium">🔵 Medium</option>
              <option value="low">⚪ Low</option>
            </select>

            {/* Submitter Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-[#0F5132]"
            >
              <option value="all">All Roles</option>
              <option value="farmer">🌾 Farmers</option>
              <option value="cooperative">🤝 Cooperatives</option>
              <option value="buyer">🛒 Buyers</option>
              <option value="trader">📦 Traders</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── THE 6 SPECIFIED SUPPORT COLUMNS TABLE ── */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF8F5]">
          <div>
            <h3 className="font-extrabold text-sm text-[#111827]">
              Support Tickets & User Inquiries Register
            </h3>
            <p className="text-[11px] text-gray-500">
              Displaying {filteredTickets.length} of {tickets.length} total tickets
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#0F5132] bg-[#E8F5E9] px-2.5 py-1 rounded-lg border border-[#C8E6C9]">
              Live Desk Synchronized
            </span>
          </div>
        </div>

        {filteredTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#E8F5E9] text-[#0F5132] font-black border-b border-[#C8E6C9] uppercase tracking-wider text-[11px]">
                  {/* 1. Ticket ID & Time */}
                  <th className="p-3.5">1. Ticket ID & Time</th>

                  {/* 2. Submitter & Contact */}
                  <th className="p-3.5">2. Submitter & Contact</th>

                  {/* 3. Topic & Priority */}
                  <th className="p-3.5">3. Topic & Priority</th>

                  {/* 4. Inquiry Message */}
                  <th className="p-3.5 min-w-[280px]">4. Inquiry Message</th>

                  {/* 5. Status */}
                  <th className="p-3.5">5. Status</th>

                  {/* 6. Actions */}
                  <th className="p-3.5 text-right">6. Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredTickets.map((ticket) => {
                  const statusConf = TICKET_STATUS_CONFIG[ticket.status] || TICKET_STATUS_CONFIG.open;
                  const priorityConf = TICKET_PRIORITY_CONFIG[ticket.priority] || TICKET_PRIORITY_CONFIG.medium;
                  const topicConf = TICKET_TOPIC_CONFIG[ticket.topic] || TICKET_TOPIC_CONFIG.general_inquiry;

                  const relativeTime = (() => {
                    const diffMs = Date.now() - new Date(ticket.createdAt).getTime();
                    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                    if (diffHrs < 1) return 'Just now';
                    if (diffHrs < 24) return `${diffHrs}h ago`;
                    const diffDays = Math.floor(diffHrs / 24);
                    return `${diffDays}d ago`;
                  })();

                  const cleanPhone = ticket.submitterPhone.replace(/[^0-9]/g, '');

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-[#FAF8F5] transition-colors cursor-pointer group"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      {/* ═══════════════════════════════════════════════════════
                          1. TICKET ID & TIME
                          ═══════════════════════════════════════════════════════ */}
                      <td className="p-3.5 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-xs text-[#0F5132] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              #{ticket.id}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyId(ticket.id, e)}
                              className="text-gray-400 hover:text-gray-700 p-0.5"
                              title="Copy Ticket ID"
                            >
                              {copiedId === ticket.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          <div className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{relativeTime}</span>
                          </div>

                          <div className="text-[10px] text-gray-400">
                            {new Date(ticket.createdAt).toLocaleDateString('en-NG', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </td>

                      {/* ═══════════════════════════════════════════════════════
                          2. SUBMITTER & CONTACT
                          ═══════════════════════════════════════════════════════ */}
                      <td className="p-3.5 align-top">
                        <div className="space-y-1.5 max-w-[200px]">
                          <div className="font-bold text-xs text-[#111827] flex items-center gap-1.5">
                            <span>{ticket.submitterName}</span>
                          </div>

                          {/* Role Badge */}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                            ticket.submitterRole === 'farmer' || ticket.submitterRole === 'cooperative'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {ticket.submitterRole === 'farmer' && <Store className="w-2.5 h-2.5" />}
                            {ticket.submitterRole === 'cooperative' && <ShieldCheck className="w-2.5 h-2.5" />}
                            {ticket.submitterRole === 'buyer' && <ShoppingBag className="w-2.5 h-2.5" />}
                            <span className="capitalize">{ticket.submitterRole}</span>
                          </span>

                          {/* Contact Shortcuts */}
                          <div className="space-y-0.5 text-[11px]">
                            <a
                              href={`mailto:${ticket.submitterEmail}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-500 hover:text-[#0F5132] flex items-center gap-1 truncate"
                              title={ticket.submitterEmail}
                            >
                              <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate">{ticket.submitterEmail}</span>
                            </a>

                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${ticket.submitterPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-gray-500 hover:text-[#0F5132] flex items-center gap-1"
                                title="Click to call"
                              >
                                <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                                <span>{ticket.submitterPhone}</span>
                              </a>

                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-emerald-600 hover:text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200"
                                  title="Chat on WhatsApp"
                                >
                                  WhatsApp
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ═══════════════════════════════════════════════════════
                          3. TOPIC & PRIORITY
                          ═══════════════════════════════════════════════════════ */}
                      <td className="p-3.5 align-top">
                        <div className="space-y-2">
                          {/* Topic Pill */}
                          <div>
                            <span className="inline-block text-[11px] font-extrabold text-[#B45309] bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                              {topicConf.label}
                            </span>
                          </div>

                          {/* Priority Pill */}
                          <div>
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${priorityConf.bgColor} ${priorityConf.color} ${priorityConf.borderColor}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${priorityConf.dotColor}`} />
                              <span>{priorityConf.label}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ═══════════════════════════════════════════════════════
                          4. INQUIRY MESSAGE
                          ═══════════════════════════════════════════════════════ */}
                      <td className="p-3.5 align-top">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-xs text-gray-900 line-clamp-1">
                            {ticket.subject}
                          </h4>
                          <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                            {ticket.message}
                          </p>

                          {ticket.replies && ticket.replies.length > 0 && (
                            <div className="pt-1 flex items-center gap-1.5 text-[10px] font-bold text-[#0F5132]">
                              <MessageSquare className="w-3 h-3" />
                              <span>{ticket.replies.length} response{ticket.replies.length > 1 ? 's' : ''} logged</span>
                            </div>
                          )}

                          {ticket.adminNotes && (
                            <p className="text-[10px] text-amber-800 italic bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 line-clamp-1">
                              Note: {ticket.adminNotes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* ═══════════════════════════════════════════════════════
                          5. STATUS
                          ═══════════════════════════════════════════════════════ */}
                      <td className="p-3.5 align-top" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1.5">
                          <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(ticket.id, e.target.value as TicketStatus)}
                            className={`text-xs font-black px-2.5 py-1.5 rounded-xl border focus:outline-none cursor-pointer transition-all ${statusConf.bgColor} ${statusConf.color} ${statusConf.borderColor}`}
                          >
                            <option value="open">🟡 Open</option>
                            <option value="in_progress">🔵 In Progress</option>
                            <option value="resolved">🟢 Resolved</option>
                            <option value="closed">⚪ Closed</option>
                          </select>

                          {ticket.status === 'resolved' && ticket.resolvedAt && (
                            <span className="text-[10px] text-emerald-700 block font-medium">
                              Resolved ✓
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ═══════════════════════════════════════════════════════
                          6. ACTIONS
                          ═══════════════════════════════════════════════════════ */}
                      <td className="p-3.5 align-top text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Review & Reply Modal Action */}
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(ticket)}
                            className="inline-flex items-center gap-1 text-white bg-[#0F5132] hover:bg-[#0B3D26] font-bold text-xs px-2.5 py-1.5 rounded-xl shadow-xs transition-all active:scale-95"
                            title="Open ticket details and reply"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#FEAE3A]" />
                            <span>Reply</span>
                          </button>

                          {/* Super Admin Delete / Dismiss */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTicket(ticket.id, e)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete / Dismiss ticket"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 space-y-3 bg-[#FAF8F5]">
            <HelpCircle className="w-10 h-10 text-gray-400 mx-auto" />
            <h4 className="font-bold text-sm text-gray-700">No Support Tickets Match Filter</h4>
            <p className="text-xs text-gray-500">
              Try adjusting your search criteria or clearing filters.
            </p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SUPER ADMIN TICKET REVIEW & EXECUTIVE RESPONSE MODAL
          ═══════════════════════════════════════════════════════════════════════════ */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0F5132] via-[#115433] to-[#0B3D26] text-white p-6 relative shrink-0">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-black text-xs text-[#FEAE3A] bg-[#FEAE3A]/20 px-2 py-0.5 rounded-md border border-[#FEAE3A]/40">
                  #{selectedTicket.id}
                </span>
                <span className="text-xs text-emerald-200">
                  {new Date(selectedTicket.createdAt).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <h3 className="font-black text-lg text-white leading-tight">
                {selectedTicket.subject}
              </h3>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              
              {/* Submitter Bio Banner */}
              <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-extrabold text-sm text-[#111827]">
                    {selectedTicket.submitterName}
                  </div>
                  <div className="text-gray-500 capitalize">
                    {selectedTicket.submitterRole} • {selectedTicket.submitterEmail} • {selectedTicket.submitterPhone}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${selectedTicket.submitterEmail}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-[#E8E2D9] rounded-xl font-bold text-gray-700 hover:border-[#0F5132]"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#0F5132]" />
                    <span>Email</span>
                  </a>

                  <a
                    href={`https://wa.me/${selectedTicket.submitterPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold hover:bg-emerald-100"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Status & Priority Badge Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-bold">Category:</span>
                  <span className="font-extrabold text-[#B45309]">
                    {TICKET_TOPIC_CONFIG[selectedTicket.topic]?.label || selectedTicket.topic}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-bold">Priority:</span>
                    <span className="font-extrabold uppercase text-[#111827]">
                      {selectedTicket.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-bold">Status:</span>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as TicketStatus)}
                      className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg font-bold text-xs focus:outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Original Inquiry Message */}
              <div>
                <label className="text-[11px] font-black text-gray-700 uppercase tracking-wider block mb-1">
                  Original Inquiry Message:
                </label>
                <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-4 text-xs text-gray-800 leading-relaxed font-medium">
                  {selectedTicket.message}
                </div>
              </div>

              {/* Past Responses Thread */}
              {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#0F5132] uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Conversation & Response History ({selectedTicket.replies.length}):</span>
                  </label>
                  <div className="space-y-2.5">
                    {selectedTicket.replies.map((r) => (
                      <div
                        key={r.id}
                        className="bg-[#E8F5E9]/60 border border-[#C8E6C9] rounded-2xl p-3.5 text-xs space-y-1"
                      >
                        <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold">
                          <span className="font-extrabold text-[#0F5132]">{r.senderName}</span>
                          <span>
                            {new Date(r.createdAt).toLocaleTimeString('en-NG', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium leading-relaxed">
                          {r.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Send Executive Reply Form */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <label className="text-[11px] font-black text-[#0F5132] uppercase tracking-wider flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-[#FEAE3A]" />
                  <span>Send Executive Response / Reply to User:</span>
                </label>
                <textarea
                  rows={3}
                  value={ticketReplyText}
                  onChange={(e) => setTicketReplyText(e.target.value)}
                  placeholder={`Write executive answer or follow-up for ${selectedTicket.submitterName}...`}
                  className="w-full p-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#0F5132] resize-none leading-relaxed"
                />

                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={adminNoteText}
                    onChange={(e) => setAdminNoteText(e.target.value)}
                    placeholder="Optional internal admin note (visible to staff only)..."
                    className="flex-1 px-3 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs text-gray-700 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleSendReply}
                    disabled={isReplying || !ticketReplyText.trim()}
                    className="inline-flex items-center gap-2 bg-[#0F5132] hover:bg-[#0B3D26] disabled:bg-gray-400 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5 text-[#FEAE3A]" />
                    <span>{isReplying ? 'Sending...' : 'Send Reply'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleStatusChange(selectedTicket.id, 'resolved')}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3.5 py-2 rounded-xl transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Resolved</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-xs font-bold text-gray-600 hover:text-gray-900 px-4 py-2"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Benue Market Support & Help Desk Types ──

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type TicketTopic =
  | 'general_inquiry'
  | 'farmer_verification'
  | 'produce_listing'
  | 'subscription_plans'
  | 'payment_and_billing'
  | 'buyer_orders_logistics'
  | 'market_pricing_info'
  | 'report_scam_or_dispute'
  | 'technical_issue';

export interface TicketReply {
  id: string;
  senderName: string;
  senderEmail: string;
  senderRole: 'super_admin' | 'admin' | 'farmer' | 'buyer' | 'user';
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  /** 1. Ticket ID & Time */
  id: string; // e.g. "BM-TK-72819"
  createdAt: string; // ISO string
  updatedAt: string;
  resolvedAt?: string | null;

  /** 2. Submitter & Contact */
  userId?: string | null;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  submitterRole: 'farmer' | 'buyer' | 'cooperative' | 'trader' | 'guest';

  /** 3. Topic & Priority */
  topic: TicketTopic;
  priority: TicketPriority;

  /** 4. Inquiry Message */
  subject: string;
  message: string;
  attachments?: string[];

  /** 5. Status */
  status: TicketStatus;

  /** Internal Admin / Resolution data */
  adminNotes?: string | null;
  assignedAdmin?: string | null;
  replies?: TicketReply[];
}

export const TICKET_TOPIC_CONFIG: Record<TicketTopic, { label: string; description: string; icon: string }> = {
  general_inquiry: {
    label: 'General Marketplace Inquiry',
    description: 'General questions about buying, selling, or platform policies',
    icon: 'HelpCircle',
  },
  subscription_plans: {
    label: 'Produce Subscription & Boost Plans',
    description: 'Inquiries about Starter (₦2,000) and Growth VIP (₦5,000) plans',
    icon: 'Megaphone',
  },
  farmer_verification: {
    label: 'Farmer & Cooperative Verification',
    description: 'Assistance with verification badges, credentials, and LGA market hub',
    icon: 'ShieldCheck',
  },
  produce_listing: {
    label: 'Produce Listings & Catalog',
    description: 'Assistance creating or managing produce inventory on Benue Market',
    icon: 'Package',
  },
  payment_and_billing: {
    label: 'Payment, Paystack & Billing',
    description: 'Payment receipts, transfer confirmation, or bank checkout support',
    icon: 'CreditCard',
  },
  buyer_orders_logistics: {
    label: 'Buyer Orders & Farmgate Logistics',
    description: 'Bulk delivery, interstate transport, or connecting with suppliers',
    icon: 'Truck',
  },
  market_pricing_info: {
    label: 'Benue Market Pricing & LGA Rates',
    description: 'Produce price benchmarks across Gboko, Makurdi, Zaki Biam, etc.',
    icon: 'TrendingUp',
  },
  report_scam_or_dispute: {
    label: 'Report Suspicious Activity / Dispute',
    description: 'Immediate flag of suspicious merchants or dispute resolution',
    icon: 'AlertTriangle',
  },
  technical_issue: {
    label: 'Technical / App Experience Issue',
    description: 'Bug reports, profile picture uploads, or account login issues',
    icon: 'Wrench',
  },
};

export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}> = {
  low: {
    label: 'Low Priority',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200',
    dotColor: 'bg-slate-400',
  },
  medium: {
    label: 'Medium Priority',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500',
  },
  high: {
    label: 'High Priority',
    color: 'text-amber-800',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  urgent: {
    label: 'Urgent Priority',
    color: 'text-rose-800',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    dotColor: 'bg-rose-500',
  },
};

export const TICKET_STATUS_CONFIG: Record<TicketStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  open: {
    label: 'Open',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  resolved: {
    label: 'Resolved',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  closed: {
    label: 'Closed',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
  },
};

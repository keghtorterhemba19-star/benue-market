import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  Sparkles,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Store,
  ShoppingBag,
  Send,
  ArrowRight,
  Headphones,
} from 'lucide-react';
import type { TicketTopic } from '../../types';

interface NavbarSupportMenuProps {
  onOpenTicketModal: (topic?: TicketTopic, defaultSubject?: string) => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const NavbarSupportMenu: React.FC<NavbarSupportMenuProps> = ({
  onOpenTicketModal,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAudience, setActiveAudience] = useState<'farmer' | 'buyer'>('farmer');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (isMobileDrawer) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileDrawer]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const farmerWhatsAppMsg = encodeURIComponent(
    'Hello Benue Market Support, I am a farmer in Benue State and need assistance with produce listing, pricing, or seller verification.'
  );
  const buyerWhatsAppMsg = encodeURIComponent(
    'Hello Benue Market Support, I am a produce buyer looking for assistance with verified farmers, bulk orders, or transaction guidance.'
  );

  const activeWhatsAppLink = `https://wa.me/2348140001234?text=${
    activeAudience === 'farmer' ? farmerWhatsAppMsg : buyerWhatsAppMsg
  }`;

  // If rendering inside mobile drawer
  if (isMobileDrawer) {
    return (
      <div className="bg-gradient-to-br from-[#FAF8F5] via-white to-[#E8F5E9]/40 border border-[#C8E6C9] rounded-3xl p-4 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#0F5132] text-white flex items-center justify-center shadow-xs">
              <Headphones className="w-5 h-5 text-[#FEAE3A]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#111827]">Support & Contact Hub</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-[#4B5563]">Direct lines for Farmers & Buyers</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#0F5132] border border-[#C8E6C9]">
            Live Desk
          </span>
        </div>

        {/* Audience Toggle Tabs */}
        <div className="flex p-1 bg-[#F3F4F6] rounded-2xl border border-[#E5E7EB]">
          <button
            type="button"
            onClick={() => setActiveAudience('farmer')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeAudience === 'farmer'
                ? 'bg-white text-[#0F5132] shadow-xs'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-[#0F5132]" />
            <span>For Farmers</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAudience('buyer')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeAudience === 'buyer'
                ? 'bg-white text-[#B45309] shadow-xs'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#B45309]" />
            <span>For Buyers</span>
          </button>
        </div>

        {/* Role-Specific Quick Tip */}
        <div className="bg-white/80 p-3 rounded-2xl border border-[#E8E2D9] text-xs space-y-1.5">
          <p className="font-bold text-[#111827]">
            {activeAudience === 'farmer' ? '🌾 Farmer Direct Assistance:' : '🛒 Buyer Procurement Assistance:'}
          </p>
          <p className="text-[11px] text-[#4B5563] leading-relaxed">
            {activeAudience === 'farmer'
              ? 'Get help listing your harvest, obtaining your Verified Farmgate Badge, setting competitive prices, or reaching verified buyers.'
              : 'Verify genuine farmers across 23 Benue LGAs, arrange bulk yam/grain logistics from Zaki Biam or Makurdi, or report suspicious listings.'}
          </p>
        </div>

        {/* Quick Contact Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href="tel:+2348140001234"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-[#C8E6C9] text-[#0F5132] text-xs font-extrabold shadow-2xs transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#0F5132]" />
            <span>Call Makurdi HQ</span>
          </a>
          <a
            href={activeWhatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-extrabold shadow-2xs transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#FEAE3A]" />
            <span>WhatsApp Desk</span>
          </a>
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 border-t border-[#E8E2D9] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              if (onCloseMobileDrawer) onCloseMobileDrawer();
              onOpenTicketModal(
                activeAudience === 'farmer' ? 'farmer_verification' : 'buyer_orders_logistics',
                activeAudience === 'farmer' ? 'Farmer Assistance Request' : 'Buyer Inquiry / Verification'
              );
            }}
            className="text-xs font-extrabold text-[#0F5132] hover:underline flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-[#FEAE3A]" />
            <span>Submit Support Ticket</span>
          </button>

          <Link
            to="/contact"
            onClick={() => {
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className="text-xs font-bold text-[#6B7280] hover:text-[#111827] flex items-center gap-1"
          >
            <span>All Contact Info</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  // Desktop Navbar Dropdown
  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all group ${
          isOpen
            ? 'bg-[#0F5132] text-white shadow-sm ring-2 ring-[#0F5132]/20'
            : 'text-[#374151] hover:text-[#111827] hover:bg-[#E8F5E9]'
        }`}
        title="Benue Market Support & Contact Information"
      >
        <div className="relative flex items-center justify-center">
          <Headphones
            className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
              isOpen ? 'text-[#FEAE3A]' : 'text-[#0F5132]'
            }`}
          />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
        </div>
        <span>Support</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 opacity-70 group-hover:opacity-100 ${
            isOpen ? 'rotate-180 text-white' : 'text-gray-500'
          }`}
        />
      </button>

      {/* Floating Ultra-Modern Support Panel */}
      {isOpen && (
        <div className="absolute right-0 lg:left-1/2 lg:-translate-x-1/2 mt-2.5 w-[420px] max-w-[95vw] max-h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#0F5132] via-[#145e3c] to-[#0A3622] text-white p-4 relative overflow-hidden shrink-0">
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-[#FEAE3A]/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between relative z-10 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center p-1 rounded-lg bg-white/10 text-[#FEAE3A]">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-sm tracking-tight text-white">
                  Benue Market Support Hub
                </h3>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#FEF3C7] border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Support Desk</span>
              </div>
            </div>
            <p className="text-[11px] text-white/80 relative z-10">
              Official contact information & direct assistance for Farmers and Buyers across all 23 Benue LGAs.
            </p>
          </div>

          {/* Interactive Role Switcher Tabs */}
          <div className="p-3 bg-[#FAF8F5] border-b border-[#E8E2D9] shrink-0">
            <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
              Who is looking for help?
            </p>
            <div className="grid grid-cols-2 gap-2 bg-[#E8E2D9]/50 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveAudience('farmer')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  activeAudience === 'farmer'
                    ? 'bg-white text-[#0F5132] shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>I am a Farmer</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveAudience('buyer')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  activeAudience === 'buyer'
                    ? 'bg-white text-[#B45309] shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#B45309]" />
                <span>I am a Buyer</span>
              </button>
            </div>
          </div>

          {/* Role-Specific Quick Topics Guidance & Contact Info (Scrollable Body) */}
          <div className="p-4 space-y-3.5 flex-1 overflow-y-auto overscroll-contain">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#111827]">
                  {activeAudience === 'farmer'
                    ? '🌾 Farmer Quick Support Services'
                    : '🛒 Buyer Procurement & Safety Services'}
                </span>
                <span className="text-[10px] font-bold text-[#0F5132]">23 LGAs Supported</span>
              </div>

              {activeAudience === 'farmer' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenTicketModal('produce_listing', 'Assistance listing farm produce harvest');
                    }}
                    className="p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#E8F5E9] border border-[#E8E2D9] text-left transition-colors group cursor-pointer"
                  >
                    <p className="text-xs font-bold text-[#111827] group-hover:text-[#0F5132]">
                      List Harvest Produce
                    </p>
                    <p className="text-[10px] text-[#6B7280] line-clamp-1">
                      Guidance on pricing & photos
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenTicketModal('farmer_verification', 'Request Farmer Verification Badge');
                    }}
                    className="p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#E8F5E9] border border-[#E8E2D9] text-left transition-colors group cursor-pointer"
                  >
                    <p className="text-xs font-bold text-[#111827] group-hover:text-[#0F5132]">
                      Get Verified Badge
                    </p>
                    <p className="text-[10px] text-[#6B7280] line-clamp-1">
                      Build trust with buyers
                    </p>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenTicketModal('buyer_orders_logistics', 'Bulk agro commodity purchase inquiry');
                    }}
                    className="p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-amber-50 border border-[#E8E2D9] text-left transition-colors group cursor-pointer"
                  >
                    <p className="text-xs font-bold text-[#111827] group-hover:text-[#B45309]">
                      Bulk Yam & Grain Orders
                    </p>
                    <p className="text-[10px] text-[#6B7280] line-clamp-1">
                      Zaki Biam & Makurdi depots
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenTicketModal('report_scam_or_dispute', 'Report listing or farmer inquiry');
                    }}
                    className="p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-red-50 border border-[#E8E2D9] text-left transition-colors group cursor-pointer"
                  >
                    <p className="text-xs font-bold text-[#111827] group-hover:text-red-700">
                      Dispute & Safety
                    </p>
                    <p className="text-[10px] text-[#6B7280] line-clamp-1">
                      Verify genuine farmgate
                    </p>
                  </button>
                </div>
              )}
            </div>

            {/* Official Contact Cards with Copy & Click-to-Call */}
            <div className="space-y-2 pt-1 border-t border-[#E8E2D9]">
              <p className="text-[10px] font-extrabold text-[#6B7280] uppercase tracking-wider">
                Official Benue Market Contact Channels
              </p>

              {/* Phone 1: Central Makurdi */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#0F5132]/40 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#E8F5E9] text-[#0F5132] flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-[#111827]">+234 814 000 1234</span>
                      <span className="text-[9px] font-bold text-[#0F5132] bg-[#E8F5E9] px-1.5 py-0.2 rounded">
                        Makurdi HQ
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6B7280]">Central Help & Inquiries</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopy('+2348140001234', 'phone1')}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-[#0F5132] hover:bg-[#E8F5E9] transition-colors"
                    title="Copy phone number"
                  >
                    {copiedKey === 'phone1' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href="tel:+2348140001234"
                    className="px-2.5 py-1 rounded-lg bg-[#0F5132] text-white text-[11px] font-extrabold hover:bg-[#0B3D26] transition-colors flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>
              </div>

              {/* Phone 2: Zaki Biam Ag-Hub */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#B45309]/40 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#B45309] flex items-center justify-center shrink-0">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-[#111827]">+234 802 000 5678</span>
                      <span className="text-[9px] font-bold text-[#B45309] bg-[#FEF3C7] px-1.5 py-0.2 rounded">
                        Zaki Biam Hub
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6B7280]">Yam Depot & Freight Desk</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopy('+2348020005678', 'phone2')}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-[#B45309] hover:bg-amber-50 transition-colors"
                    title="Copy phone number"
                  >
                    {copiedKey === 'phone2' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href="tel:+2348020005678"
                    className="px-2.5 py-1 rounded-lg bg-[#B45309] text-white text-[11px] font-extrabold hover:bg-[#8F3E07] transition-colors flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>
              </div>

              {/* WhatsApp Live Desk & Support Email */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={activeWhatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-[#0F5132] transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-[#0F5132] shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-extrabold">WhatsApp Chat</p>
                    <p className="text-[10px] text-[#0F5132]/80">Instant Response</p>
                  </div>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('support@benuemarket.ng', 'email')}
                  className="p-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-gray-100 border border-[#E8E2D9] text-[#111827] transition-colors flex items-center gap-2 text-left"
                >
                  <Mail className="w-4 h-4 text-[#6B7280] shrink-0" />
                  <div className="truncate">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-extrabold truncate">Email Support</p>
                      {copiedKey === 'email' && <Check className="w-3 h-3 text-emerald-600" />}
                    </div>
                    <p className="text-[10px] text-[#6B7280] truncate">
                      {copiedKey === 'email' ? 'Copied to clipboard!' : 'support@benuemarket.ng'}
                    </p>
                  </div>
                </button>
              </div>

              {/* Physical Hubs & Operating Hours */}
              <div className="bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#E8E2D9] flex items-center justify-between text-[11px] text-[#4B5563]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0F5132] shrink-0" />
                  <span className="truncate">Makurdi Central & Zaki Biam Yam Depot</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-[#6B7280] shrink-0">
                  <Clock className="w-3 h-3 text-[#FEAE3A]" />
                  <span>Mon-Sat: 7am-7pm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions Footer */}
          <div className="p-3 bg-gradient-to-r from-[#FAF8F5] to-[#E8F5E9]/50 border-t border-[#E8E2D9] flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenTicketModal(
                  activeAudience === 'farmer' ? 'general_inquiry' : 'buyer_orders_logistics',
                  `Support Request (${activeAudience === 'farmer' ? 'Farmer' : 'Buyer'})`
                );
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-extrabold shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-[#FEAE3A]" />
              <span>Submit Support Ticket</span>
            </button>

            <Link
              to="/contact"
              onClick={() => setIsOpen(false)}
              className="py-2 px-3 rounded-xl bg-white hover:bg-[#F3F4F6] text-[#111827] text-xs font-bold border border-[#E8E2D9] transition-colors flex items-center gap-1 shrink-0"
            >
              <span>Full Contact Page</span>
              <ExternalLink className="w-3 h-3 text-[#6B7280]" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

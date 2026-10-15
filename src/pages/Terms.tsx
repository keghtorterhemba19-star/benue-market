import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Scale,
  Sprout,
  ShoppingBag,
  Zap,
  Search,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ChevronRight,
  Printer,
  Info,
} from 'lucide-react';
import {
  CURRENT_TERMS_VERSION,
  TERMS_EFFECTIVE_DATE,
  LEGAL_SECTIONS,
} from '../constants/legal';
import { useAuth } from '../context/AuthContext';

type TabKey = 'all' | 'farmer' | 'buyer' | 'promotion' | 'safety' | 'privacy';

export const Terms: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') as TabKey | null;
  const initialTab: TabKey =
    rawTab === 'farmer' ||
    rawTab === 'buyer' ||
    rawTab === 'promotion' ||
    rawTab === 'safety' ||
    rawTab === 'privacy'
      ? rawTab
      : 'all';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [acceptanceNotice, setAcceptanceNotice] = useState<string | null>(null);

  const { currentUser, acceptTerms, termsAccepted, currentTermsVersion } = useAuth();

  useEffect(() => {
    if (rawTab && rawTab !== activeTab) {
      if (['farmer', 'buyer', 'promotion', 'safety', 'privacy', 'all'].includes(rawTab)) {
        setActiveTab(rawTab as TabKey);
      }
    }
  }, [rawTab]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (tab === 'all') {
        p.delete('tab');
      } else {
        p.set('tab', tab);
      }
      return p;
    });
  };

  const handleUserAccept = async () => {
    const success = await acceptTerms(CURRENT_TERMS_VERSION);
    if (success) {
      setAcceptanceNotice(`You have accepted Benue Market Terms & Conditions v${CURRENT_TERMS_VERSION}.`);
      setTimeout(() => setAcceptanceNotice(null), 5000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter sections by tab and search
  const filteredSections = LEGAL_SECTIONS.filter((section) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'farmer' && (section.category === 'farmer' || section.id === 'direct-connection-model')) ||
      (activeTab === 'buyer' && (section.category === 'buyer' || section.id === 'direct-connection-model')) ||
      (activeTab === 'promotion' && section.category === 'promotion') ||
      (activeTab === 'safety' && (section.category === 'safety' || section.id === 'prohibited-conduct')) ||
      (activeTab === 'privacy' && section.category === 'privacy');

    if (!matchesTab) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const titleMatch = section.title.toLowerCase().includes(q);
    const summaryMatch = section.summary?.toLowerCase().includes(q) || false;
    const bodyMatch = section.paragraphs.some((p) => p.toLowerCase().includes(q));
    const bulletsMatch = section.bulletPoints?.some((b) => b.toLowerCase().includes(q)) || false;

    return titleMatch || summaryMatch || bodyMatch || bulletsMatch;
  });

  return (
    <div className="w-full bg-[#FAF8F5] min-h-screen py-8 md:py-14">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        
        {/* Header Hero Section */}
        <div className="bg-gradient-to-br from-[#08291B] via-[#0F5132] to-[#14442A] text-white p-8 md:p-12 rounded-3xl shadow-xl relative overflow-hidden border border-[#184E33]">
          {/* Subtle Agricultural Background Accents */}
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-12 top-8 opacity-10 pointer-events-none hidden lg:block">
            <Scale className="w-48 h-48 text-[#FEAE3A]" />
          </div>

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-[#FEAE3A] text-xs font-black uppercase tracking-wider border border-white/15">
              <Scale className="w-3.5 h-3.5" />
              <span>Benue State Direct Farmgate Commerce Governance</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Terms & Conditions & Operational Policies
            </h1>

            <p className="text-sm md:text-base text-emerald-100/90 leading-relaxed">
              Official operating rules, seller listing obligations, buyer conduct standards, and direct connection guidelines for Benue Market.
            </p>

            {/* Version Metadata Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="bg-emerald-950/60 border border-emerald-700/60 text-emerald-200 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#FEAE3A]" />
                <span>Version {CURRENT_TERMS_VERSION}</span>
              </span>
              <span className="bg-emerald-950/60 border border-emerald-700/60 text-emerald-200 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Effective: {TERMS_EFFECTIVE_DATE}</span>
              </span>
              <span className="bg-emerald-950/60 border border-emerald-700/60 text-emerald-200 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>0% Commission Direct Trade Model</span>
              </span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Platform Notice:</strong> Benue Market provides direct bilateral introductions between farmers and buyers. This policy copy is configurable for administrative governance and is subject to review by authorized legal counsel prior to formal production changes.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Terms</span>
          </button>
        </div>

        {/* Acceptance Banner for Logged-In Users */}
        {currentUser && (
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-sm transition-all ${
            termsAccepted
              ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#0F5132]'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F5132] text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#FEAE3A]" />
              </div>
              <div>
                <p className="font-extrabold text-sm">
                  {termsAccepted
                    ? `Terms Accepted (v${currentUser.termsAcceptedVersion || currentTermsVersion})`
                    : `Action Needed: Please review and accept Version ${currentTermsVersion}`}
                </p>
                <p className="text-[11px] opacity-80">
                  {termsAccepted && currentUser.termsAcceptedAt
                    ? `Accepted by ${currentUser.name} on ${new Date(currentUser.termsAcceptedAt).toLocaleDateString()}`
                    : `Account: ${currentUser.email} (${currentUser.role === 'seller' ? 'Farmer / Seller' : 'Buyer / Merchant'})`}
                </p>
              </div>
            </div>

            {!termsAccepted && (
              <button
                type="button"
                onClick={handleUserAccept}
                className="bg-[#0F5132] hover:bg-[#0B3D26] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
              >
                Accept Current Terms (v{CURRENT_TERMS_VERSION})
              </button>
            )}
          </div>
        )}

        {acceptanceNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{acceptanceNotice}</span>
          </div>
        )}

        {/* Navigation Tabs and Search Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Tab Pills */}
            <div className="bg-[#EFEAE2] p-1.5 rounded-2xl flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleTabChange('all')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#0F5132] text-white shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827] hover:bg-white/60'
                }`}
              >
                All Terms ({LEGAL_SECTIONS.length})
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('farmer')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'farmer'
                    ? 'bg-[#0F5132] text-white shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827] hover:bg-white/60'
                }`}
              >
                <Sprout className="w-3.5 h-3.5" />
                <span>Farmer Rules</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('buyer')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'buyer'
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827] hover:bg-white/60'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Buyer Standards</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('promotion')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'promotion'
                    ? 'bg-[#B45309] text-white shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827] hover:bg-white/60'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Promotions (₦2k / ₦5k)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('safety')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'safety'
                    ? 'bg-[#0F5132] text-white shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827] hover:bg-white/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Direct Trade Safety</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('privacy')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'privacy'
                    ? 'bg-[#0F5132] text-white shadow-xs'
                    : 'text-[#4B5563] hover:text-[#111827] hover:bg-white/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Privacy Policy</span>
              </button>
            </div>

            {/* Keyword Search */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search legal clauses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D6CDC0] rounded-xl text-xs sm:text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#0F5132] font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Layout with Sticky Table of Contents */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar TOC (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] shadow-sm sticky top-32 space-y-3">
              <h2 className="font-extrabold text-xs uppercase tracking-wider text-[#6B7280] pb-2 border-b border-[#E8E2D9]">
                Table of Contents
              </h2>
              <nav className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
                {LEGAL_SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className={`block text-xs py-1.5 px-2 rounded-lg transition-colors leading-snug ${
                      filteredSections.some((s) => s.id === sec.id)
                        ? 'text-[#374151] hover:text-[#0F5132] hover:bg-emerald-50'
                        : 'text-gray-300 pointer-events-none'
                    }`}
                  >
                    <span className="font-bold text-[#0F5132] mr-1.5">{sec.number}.</span>
                    <span>{sec.title}</span>
                  </a>
                ))}
              </nav>

              <div className="pt-3 border-t border-[#E8E2D9] space-y-2 text-xs text-[#6B7280]">
                <p className="font-bold text-[#111827]">Need clarification?</p>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1 text-[#0F5132] font-extrabold hover:underline"
                >
                  <span>Contact Support Desk</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Legal Sections Feed */}
          <div className="lg:col-span-3 space-y-6">
            {filteredSections.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-[#E8E2D9] text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
                <h3 className="font-black text-lg text-[#111827]">No Matching Terms Found</h3>
                <p className="text-xs text-[#6B7280]">
                  No section matched your keyword "{searchQuery}". Try a different keyword or reset your filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveTab('all');
                  }}
                  className="bg-[#0F5132] text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredSections.map((section) => (
                <article
                  key={section.id}
                  id={section.id}
                  className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4 scroll-mt-36 hover:border-[#0F5132]/40 transition-colors"
                >
                  {/* Section Title & Number */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#F0EBE1] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-[#0F5132] text-white flex items-center justify-center font-black text-xs shrink-0">
                          {section.number}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#B45309] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          {section.category.toUpperCase()} CLAUSE
                        </span>
                      </div>
                      <h2 className="font-black text-xl sm:text-2xl text-[#111827] pt-1 tracking-tight">
                        {section.title}
                      </h2>
                    </div>

                    <a
                      href={`#${section.id}`}
                      className="text-xs font-bold text-gray-400 hover:text-[#0F5132] shrink-0"
                      title="Link to this section"
                    >
                      #{section.id}
                    </a>
                  </div>

                  {/* Summary Callout if present */}
                  {section.summary && (
                    <div className="p-3.5 rounded-2xl bg-[#F8F6F2] border border-[#E8E2D9] text-xs font-semibold text-[#374151] flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
                      <span>{section.summary}</span>
                    </div>
                  )}

                  {/* Paragraphs */}
                  <div className="space-y-3 text-sm text-[#4B5563] leading-relaxed">
                    {section.paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>

                  {/* Bullet Points if present */}
                  {section.bulletPoints && section.bulletPoints.length > 0 && (
                    <ul className="space-y-2 pt-2 text-sm text-[#374151]">
                      {section.bulletPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0 mt-1" />
                          <span className="leading-relaxed font-medium">{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))
            )}

            {/* Bottom Quick Links to Support and Registration */}
            <div className="bg-gradient-to-r from-[#0F5132] to-[#0B3D26] text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="font-black text-lg">Questions regarding our direct trade model?</h3>
                <p className="text-xs text-emerald-100 max-w-md">
                  Our customer desk is located in Makurdi, Benue State, supporting verified farmers, agricultural cooperatives, and interstate buyers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  to="/contact"
                  className="bg-[#FEAE3A] hover:bg-[#F59E0B] text-[#111827] font-black text-xs px-5 py-3 rounded-xl shadow-md transition-all"
                >
                  Contact Desk
                </Link>
                <Link
                  to="/register"
                  className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-3 rounded-xl border border-white/20 transition-all"
                >
                  Create Account
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Terms;

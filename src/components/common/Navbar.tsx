import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin,
  PlusCircle,
  Menu,
  X,
  Heart,
  LogOut,
  ShieldCheck,
  Store,
  ShoppingBag,
  ChevronDown,
  Camera,
  Home as HomeIcon,
  Users,
  Info,
  Search,
  ChevronRight,
  Leaf,
  Sparkles,
  HelpCircle,
  Headphones,
} from 'lucide-react';
import { BENUE_LGAS } from '../../constants/benue';
import { useProducts } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import { NavbarSupportMenu } from './NavbarSupportMenu';
import { SupportTicketModal } from './SupportTicketModal';
import type { BenueLGA, TicketTopic } from '../../types';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { filter, setFilter, savedProductIds } = useProducts();
  const { currentUser, isAuthenticated, logout, isSuperAdmin, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isSupportTicketModalOpen, setIsSupportTicketModalOpen] = useState(false);
  const [supportModalTopic, setSupportModalTopic] = useState<TicketTopic>('general_inquiry');
  const [supportModalSubject, setSupportModalSubject] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleOpenTicketModal = (topic: TicketTopic = 'general_inquiry', defaultSubject: string = '') => {
    setSupportModalTopic(topic);
    setSupportModalSubject(defaultSubject);
    setIsSupportTicketModalOpen(true);
  };

  const isActive = (path: string) => location.pathname === path;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
    return () => document.body.classList.remove('mobile-menu-open');
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLGASelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as BenueLGA | 'all';
    setFilter((prev) => ({ ...prev, lga: val }));
    if (location.pathname !== '/browse') {
      navigate('/browse');
    }
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // Navigation items for mobile drawer
  const navItems = [
    { path: '/', label: 'Home', icon: HomeIcon, description: 'Marketplace overview' },
    { path: '/browse', label: 'Browse Produce', icon: Search, description: 'Search all listings' },
    { path: '/directory', label: 'Farmers Directory', icon: Users, description: 'Connect with farmers' },
    { path: '/sell-produce', label: 'List Produce', icon: PlusCircle, description: 'Sell your harvest', accent: true },
    { path: '/about', label: 'About', icon: Info, description: 'Our mission' },
    { path: '/contact', label: 'Support & Contact', icon: Headphones, description: 'Benue Market Help Desk' },
  ];

  // Bottom tab items for mobile
  const bottomTabs = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/browse', label: 'Browse', icon: Search },
    { path: '/sell-produce', label: 'Sell', icon: PlusCircle, primary: true },
    { path: '/buyer-dashboard', label: 'Saved', icon: Heart, badge: savedProductIds.length },
    { path: isAdmin ? '/admin' : currentUser?.role === 'seller' ? '/farmer-dashboard' : '/buyer-dashboard', label: 'Account', icon: isAuthenticated ? Store : ShoppingBag },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FBF9F6]/95 backdrop-blur-md border-b border-[#E8E2D9]">
        {/* Top Banner - Marquee */}
        <div className="bg-[#0F5132] text-white py-1.5 overflow-hidden relative shadow-inner border-b border-[#0A3622]">
          <div className="animate-marquee-infinite text-xs font-semibold tracking-wide flex items-center gap-8 whitespace-nowrap">
            <div className="flex items-center gap-6">
              <span>🌾 Direct Agricultural Commerce across 23 Benue LGAs</span>
              <span className="text-[#FEAE3A] font-bold">•</span>
              <span>Zero Middleman Markup</span>
              <span className="text-[#FEAE3A] font-bold">•</span>
              <span className="text-[#FEAE3A] font-extrabold bg-[#FEAE3A]/20 px-2 py-0.5 rounded-full">₦0 Commission</span>
              <span className="text-[#FEAE3A] font-bold">•</span>
              <span>Verified Farmgate Produce</span>
              <span className="text-[#FEAE3A] font-bold">•</span>
              <span>Direct Farmer-to-Buyer Connections</span>
            </div>
            <div className="flex items-center gap-6" aria-hidden="true">
              <span>🌾 Direct Agricultural Commerce across 23 Benue LGAs</span>
              <span className="text-[#FEAE3A] font-bold">•</span>
              <span>Zero Middleman Markup</span>
              <span className="text-[#FEAE3A] font-bold">•</span>
              <span className="text-[#FEAE3A] font-extrabold bg-[#FEAE3A]/20 px-2 py-0.5 rounded-full">₦0 Commission</span>
              <span className="text-[#FEAE3A] font-bold">•</span>
              <span>Verified Farmgate Produce</span>
              <span className="text-[#FEAE3A] font-bold">•</span>
              <span>Direct Farmer-to-Buyer Connections</span>
            </div>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="h-16 md:h-20 max-w-7xl mx-auto px-3 sm:px-6 md:px-8 flex items-center justify-between gap-2 lg:gap-6">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] rounded-lg p-0.5"
          >
            <img
              src="/logo.png"
              alt="Benue Market Logo"
              className="h-9 sm:h-10 md:h-11 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
            />
            <div className="flex flex-col shrink-0">
              <span className="font-extrabold text-base sm:text-lg md:text-xl text-[#0F5132] tracking-tight leading-none whitespace-nowrap">
                Benue Market
              </span>
              <span className="text-[10px] sm:text-xs text-[#B45309] font-bold tracking-wider mt-0.5 whitespace-nowrap">
                Buy. Sell. Connect.
              </span>
            </div>
          </Link>

          {/* Center Desktop LGA Selector & Nav Links */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            <div className="flex items-center bg-[#E8F5E9] px-3 py-1.5 rounded-lg gap-2 text-[#374151] border border-[#C8E6C9] shrink-0 shadow-xs mr-1">
              <MapPin className="w-3.5 h-3.5 text-[#0F5132]" />
              <span className="text-xs font-semibold text-[#111827] shrink-0">LGA:</span>
              <select
                value={filter.lga}
                onChange={handleLGASelect}
                className="bg-transparent text-xs font-bold text-[#0F5132] focus:outline-none cursor-pointer pr-1 max-w-[150px] truncate"
              >
                <option value="all">All 23 Benue LGAs</option>
                {BENUE_LGAS.map((lga) => (
                  <option key={lga.name} value={lga.name}>
                    {lga.name} ({lga.majorMarket})
                  </option>
                ))}
              </select>
            </div>

            <nav className="flex items-center gap-1 xl:gap-1.5">
              <Link to="/" className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isActive('/') ? 'bg-[#0F5132] text-white shadow-sm' : 'text-[#374151] hover:text-[#111827] hover:bg-[#E8F5E9]'}`}>Home</Link>
              <Link to="/browse" className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isActive('/browse') ? 'bg-[#0F5132] text-white shadow-sm' : 'text-[#374151] hover:text-[#111827] hover:bg-[#E8F5E9]'}`}>Browse Produce</Link>
              <Link to="/directory" className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isActive('/directory') ? 'bg-[#0F5132] text-white shadow-sm' : 'text-[#374151] hover:text-[#111827] hover:bg-[#E8F5E9]'}`}>Farmers Directory</Link>
              <Link to="/about" className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isActive('/about') ? 'bg-[#0F5132] text-white shadow-sm' : 'text-[#374151] hover:text-[#111827] hover:bg-[#E8F5E9]'}`}>About</Link>
              
              {/* Ultra-Modern Interactive Support Hub Menu */}
              <NavbarSupportMenu onOpenTicketModal={handleOpenTicketModal} />
            </nav>
          </div>

          {/* Right Desktop & Mobile Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Quick Support Button (Mobile & Tablet) */}
            <button
              type="button"
              onClick={() => handleOpenTicketModal('general_inquiry', 'Quick Help from Navbar')}
              className="lg:hidden relative p-2 text-[#374151] hover:text-[#0F5132] hover:bg-[#E8F5E9] rounded-xl border border-transparent hover:border-[#C8E6C9] transition-all flex items-center justify-center shrink-0"
              title="Benue Market Support Hub"
              aria-label="Support Desk"
            >
              <Headphones className="w-5 h-5 text-[#0F5132]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
            </button>

            {/* Saved Items Heart */}
            <Link to="/buyer-dashboard" className="relative p-2 text-[#374151] hover:text-[#0F5132] hover:bg-[#E8F5E9] rounded-lg transition-colors flex items-center justify-center shrink-0" title="Saved Products">
              <Heart className="w-5 h-5 text-[#B45309]" />
              {savedProductIds.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#B45309] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center">
                  {savedProductIds.length}
                </span>
              )}
            </Link>

            {/* Sell Produce CTA (Desktop) */}
            <Link to="/sell-produce" className="hidden sm:inline-flex items-center gap-2 bg-[#0F5132] hover:bg-[#0A3622] text-white text-sm font-bold px-3.5 sm:px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95 shrink-0">
              <PlusCircle className="w-4 h-4 text-[#FEF3C7]" />
              <span>{currentUser?.role === 'seller' ? 'Sell Produce' : 'Farmer Portal'}</span>
            </Link>

            {/* User Profile Dropdown (Desktop) */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-[#E8E2D9] focus:outline-none group cursor-pointer"
                  title="Account & Portal Controls"
                >
                  <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105 overflow-hidden ${isSuperAdmin ? 'bg-[#FEAE3A] text-[#111827] ring-2 ring-[#FEAE3A]/50 font-black' : isAdmin ? 'bg-[#0F5132] text-[#FEAE3A] ring-2 ring-[#0F5132]/30' : 'bg-[#0F5132] text-white ring-2 ring-[#C8E6C9]'}`}>
                    {currentUser?.profileImage ? (
                      <img src={currentUser.profileImage} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : isSuperAdmin ? '👑' : (currentUser?.name?.charAt(0) || 'U')}
                  </div>
                  <div className="hidden xl:flex flex-col text-left leading-tight max-w-[125px]">
                    <span className="text-xs font-bold text-[#111827] truncate">{currentUser?.name}</span>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isSuperAdmin ? 'text-[#B45309]' : isAdmin ? 'text-[#0F5132]' : 'text-[#B45309]'}`}>
                      {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Staff Admin' : currentUser?.role === 'seller' ? 'Farmer' : 'Buyer'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0F5132] transition-transform hidden sm:block" />
                </button>

                {/* Desktop Account Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-[#E8E2D9] py-2 z-50 animate-in fade-in zoom-in-95 overflow-hidden">
                    <div className="px-5 py-4 bg-[#FAF8F5] border-b border-[#E8E2D9]">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shadow-xs overflow-hidden shrink-0 ${isSuperAdmin ? 'bg-[#FEAE3A] text-[#111827]' : 'bg-[#0F5132] text-white'}`}>
                          {currentUser?.profileImage ? (
                            <img src={currentUser.profileImage} alt={currentUser.name} className="w-full h-full object-cover" />
                          ) : isSuperAdmin ? '👑' : (currentUser?.name?.charAt(0))}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-xs text-[#111827] truncate">{currentUser?.name}</p>
                          <p className="text-[11px] text-[#6B7280] truncate">{currentUser?.email}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${isSuperAdmin ? 'bg-[#FEAE3A]/30 text-[#855400] border border-[#FEAE3A]/40' : isAdmin ? 'bg-emerald-100 text-[#0F5132]' : 'bg-amber-100 text-[#B45309]'}`}>
                            {isSuperAdmin ? 'Super Administrator' : isAdmin ? 'Staff Administrator' : currentUser?.role === 'seller' ? 'Farmer / Seller' : 'Buyer / Merchant'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link to={isAdmin ? '/admin' : currentUser?.role === 'seller' ? '/farmer-dashboard' : '/buyer-dashboard'} onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#111827] hover:bg-[#E8F5E9] hover:text-[#0F5132] transition-colors">
                        {isAdmin ? <ShieldCheck className="w-4 h-4 text-[#0F5132]" /> : currentUser?.role === 'seller' ? <Store className="w-4 h-4 text-[#0F5132]" /> : <ShoppingBag className="w-4 h-4 text-[#0F5132]" />}
                        <span>{isAdmin ? 'Admin Management Console' : currentUser?.role === 'seller' ? 'My Farmer Dashboard' : 'My Buyer Dashboard'}</span>
                      </Link>
                      {isAdmin && (
                        <>
                          <Link to="/admin" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#111827] bg-amber-50/60 hover:bg-amber-100/80 transition-colors">
                            <Camera className="w-4 h-4 text-[#B45309]" />
                            <span className="font-bold text-[#B45309]">Admin Photo Gallery & Avatar</span>
                          </Link>
                          <Link to="/farmer-dashboard" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#4B5563] hover:bg-[#FAF8F5] transition-colors">
                            <Store className="w-4 h-4 text-[#B45309]" />
                            <span>Farmer Portal View</span>
                          </Link>
                        </>
                      )}
                      <Link to="/sell-produce" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#4B5563] hover:bg-[#FAF8F5] transition-colors">
                        <PlusCircle className="w-4 h-4 text-[#0F5132]" />
                        <span>List Produce Harvest</span>
                      </Link>
                      <Link to="/contact" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#4B5563] hover:bg-[#FAF8F5] transition-colors">
                        <HelpCircle className="w-4 h-4 text-[#FEAE3A]" />
                        <span>Help Desk & Support</span>
                      </Link>
                    </div>
                    <div className="p-2 border-t border-[#E8E2D9]">
                      <button type="button" onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="inline-flex items-center text-xs sm:text-sm font-bold text-[#0F5132] bg-[#E8F5E9] hover:bg-[#0F5132] hover:text-white px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg border border-[#C8E6C9] transition-colors shrink-0">
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#111827] hover:bg-[#E8F5E9] rounded-lg transition-colors shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#0F5132]" /> : <Menu className="w-6 h-6 text-[#0F5132]" />}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          PREMIUM MOBILE FULL-SCREEN DRAWER
          ═══════════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="mobile-overlay absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />

          {/* Drawer Panel */}
          <div className="mobile-drawer absolute bottom-0 left-0 right-0 max-h-[92vh] bg-white rounded-t-[28px] shadow-2xl flex flex-col overflow-hidden">
            {/* Handle Bar */}
            <div className="pt-3 pb-2 px-4">
              <div className="drawer-handle" />
            </div>

            {/* Drawer Header */}
            <div className="px-5 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#0F5132] to-[#1a7a52] flex items-center justify-center shadow-md">
                  <Leaf className="w-4.5 h-4.5 text-[#FEF3C7]" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-[#111827] tracking-tight">Benue Market</h2>
                  <p className="text-[10px] text-[#6B7280] font-semibold">Navigate the marketplace</p>
                </div>
              </div>
              <button
                onClick={closeMobileMenu}
                className="w-9 h-9 rounded-2xl bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors active:scale-90"
              >
                <X className="w-4.5 h-4.5 text-[#374151]" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
              {/* LGA Quick Filter */}
              <div className="mb-4 bg-gradient-to-r from-[#E8F5E9] to-[#F0FFF4] p-3.5 rounded-2xl border border-[#C8E6C9]/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0F5132] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-[#0F5132] uppercase tracking-wider mb-0.5">Local Government Area</p>
                    <select
                      value={filter.lga}
                      onChange={(e) => { handleLGASelect(e); closeMobileMenu(); }}
                      className="bg-transparent text-sm font-extrabold text-[#111827] focus:outline-none w-full cursor-pointer"
                    >
                      <option value="all">All 23 Benue LGAs</option>
                      {BENUE_LGAS.map((lga) => (
                        <option key={lga.name} value={lga.name}>{lga.name} ({lga.majorMarket})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={`nav-stagger flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.97] ${
                        active
                          ? 'bg-[#0F5132] text-white shadow-lg shadow-[#0F5132]/20'
                          : item.accent
                          ? 'bg-gradient-to-r from-[#FEF3C7]/60 to-[#FFFBEB] text-[#B45309] border border-[#FEAE3A]/30'
                          : 'text-[#111827] hover:bg-[#F9FAFB] active:bg-[#F3F4F6]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        active
                          ? 'bg-white/20'
                          : item.accent
                          ? 'bg-[#FEAE3A]/15'
                          : 'bg-[#F3F4F6]'
                      }`}>
                        <Icon className={`w-5 h-5 ${active ? 'text-white' : item.accent ? 'text-[#B45309]' : 'text-[#0F5132]'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-extrabold ${active ? 'text-white' : ''}`}>{item.label}</p>
                        <p className={`text-[11px] ${active ? 'text-white/70' : 'text-[#9CA3AF]'} font-medium`}>{item.description}</p>
                      </div>
                      {active && <div className="nav-active-dot bg-white shrink-0" />}
                      {!active && <ChevronRight className={`w-4 h-4 shrink-0 ${item.accent ? 'text-[#B45309]/40' : 'text-[#D1D5DB]'}`} />}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Support & Contact Hub */}
              <div className="mt-4">
                <NavbarSupportMenu
                  isMobileDrawer={true}
                  onOpenTicketModal={handleOpenTicketModal}
                  onCloseMobileDrawer={closeMobileMenu}
                />
              </div>

              {/* User Profile Card */}
              {isAuthenticated && currentUser ? (
                <div className="profile-card-animate mt-5">
                  <div className="bg-gradient-to-br from-[#FAF8F5] to-white p-4 rounded-3xl border border-[#E8E2D9] shadow-sm">
                    {/* Profile Header */}
                    <div className="flex items-center gap-3 mb-3.5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base shadow-md overflow-hidden shrink-0 ring-2 ring-offset-1 ${
                        isSuperAdmin ? 'bg-gradient-to-br from-[#FEAE3A] to-[#F59E0B] text-[#111827] ring-[#FEAE3A]/50' : 'bg-gradient-to-br from-[#0F5132] to-[#1a7a52] text-white ring-[#C8E6C9]'
                      }`}>
                        {currentUser.profileImage ? (
                          <img src={currentUser.profileImage} alt={currentUser.name} className="w-full h-full object-cover" />
                        ) : isSuperAdmin ? '👑' : (currentUser.name?.charAt(0) || 'U')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-sm text-[#111827] truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-[#6B7280] truncate font-medium">{currentUser.email}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider shrink-0 ${
                        isSuperAdmin
                          ? 'bg-gradient-to-r from-[#FEAE3A]/20 to-[#FEF3C7] text-[#855400] border border-[#FEAE3A]/30'
                          : isAdmin
                          ? 'bg-[#E8F5E9] text-[#0F5132] border border-[#C8E6C9]'
                          : 'bg-[#FEF3C7] text-[#B45309] border border-[#FEAE3A]/30'
                      }`}>
                        {isSuperAdmin ? '👑 Super Admin' : isAdmin ? 'Admin' : currentUser.role === 'seller' ? 'Farmer' : 'Buyer'}
                      </span>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="space-y-2">
                      <Link
                        to={isAdmin ? '/admin' : currentUser.role === 'seller' ? '/farmer-dashboard' : '/buyer-dashboard'}
                        onClick={closeMobileMenu}
                        className="flex items-center justify-center gap-2 w-full bg-[#0F5132] hover:bg-[#0A3622] text-white font-extrabold text-xs py-3 rounded-2xl shadow-md transition-all active:scale-[0.97]"
                      >
                        {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                        <span>{isAdmin ? 'Admin Console' : currentUser.role === 'seller' ? 'Farmer Dashboard' : 'Buyer Dashboard'}</span>
                        <Sparkles className="w-3.5 h-3.5 text-[#FEAE3A]" />
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs py-2.5 rounded-2xl border border-red-200/60 transition-all active:scale-[0.97]"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="profile-card-animate mt-5 space-y-2">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center gap-2 w-full bg-[#0F5132] hover:bg-[#0A3622] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-md transition-all active:scale-[0.97]"
                  >
                    <span>Sign In to Benue Market</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center gap-2 w-full bg-[#FAF8F5] hover:bg-[#F3F4F6] text-[#374151] font-bold text-xs py-2.5 rounded-2xl border border-[#E8E2D9] transition-colors"
                  >
                    <span>Create Free Account</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          FIXED BOTTOM TAB BAR (Mobile-Native Style)
          Visible on mobile only, replaces the old horizontal pill nav
          ═══════════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bottom-tab-bar">
        {/* Frosted glass background */}
        <div className="bg-white/90 backdrop-blur-xl border-t border-[#E8E2D9]/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-end justify-around px-1 pt-1.5 pb-2" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
            {bottomTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.path);

              if (tab.primary) {
                // Center "Sell" FAB-style button
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className="flex flex-col items-center -mt-4 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0F5132] to-[#1a7a52] flex items-center justify-center shadow-lg shadow-[#0F5132]/30 group-active:scale-90 transition-transform border-4 border-white">
                      <PlusCircle className="w-6 h-6 text-[#FEF3C7]" />
                    </div>
                    <span className="text-[10px] font-bold text-[#0F5132] mt-0.5">{tab.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all active:scale-90 min-w-[56px] ${
                    active ? 'tab-bounce' : ''
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition-colors ${active ? 'text-[#0F5132]' : 'text-[#9CA3AF]'}`} strokeWidth={active ? 2.5 : 1.8} />
                    {tab.badge && tab.badge > 0 ? (
                      <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-[#B45309] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className={`text-[10px] font-bold transition-colors ${active ? 'text-[#0F5132]' : 'text-[#9CA3AF]'}`}>
                    {tab.label}
                  </span>
                  {active && (
                    <div className="w-1 h-1 rounded-full bg-[#0F5132] mt-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Global Interactive Support Ticket Modal */}
      <SupportTicketModal
        isOpen={isSupportTicketModalOpen}
        onClose={() => setIsSupportTicketModalOpen(false)}
        defaultTopic={supportModalTopic}
        defaultSubject={supportModalSubject}
      />
    </>
  );
};

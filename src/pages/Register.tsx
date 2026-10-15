import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  UserCheck,
  KeyRound,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  Sprout,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';
import type { UserRole, BenueLGA } from '../types';
import { useAuth } from '../context/AuthContext';
import { BENUE_LGAS } from '../constants/benue';
import { cleanNigerianPhoneForWhatsapp } from '../utils/formatters';
import { validatePersonalEmail } from '../utils/emailValidator';
import { CURRENT_TERMS_VERSION } from '../constants/legal';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const paramRole = searchParams.get('role');

  // Determine initial role: default to 'seller' if 'farmer' or 'seller', else 'buyer'
  const resolvedInitialRole: UserRole =
    paramRole === 'farmer' || paramRole === 'seller' ? 'seller' : 'buyer';

  const { register } = useAuth();
  const [role, setRole] = useState<UserRole>(resolvedInitialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [lga, setLga] = useState<BenueLGA>('Makurdi');
  const [farmProduceCategory, setFarmProduceCategory] = useState('Tubers (Yams & Cassava)');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  // Duplicate email modal state
  const [existingEmailModal, setExistingEmailModal] = useState<{
    isOpen: boolean;
    email: string;
    message: string;
  }>({
    isOpen: false,
    email: '',
    message: '',
  });

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (paramRole === 'farmer' || paramRole === 'seller') {
      setRole('seller');
    } else if (paramRole === 'buyer') {
      setRole('buyer');
    }
  }, [initialEmail, paramRole]);

  const handleRoleSwitch = (newRole: UserRole) => {
    setRole(newRole);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('role', newRole === 'seller' ? 'farmer' : 'buyer');
      return p;
    });
  };

  const isMinLength = password.length >= 6;
  const isMatch = password.length > 0 && password === confirmPassword;
  const isFarmer = role === 'seller';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setPasswordError(null);
    setTermsError(null);

    // Validate personal email address
    const validation = validatePersonalEmail(email);
    if (!validation.isValid) {
      setEmailError(validation.error || 'Please enter a valid personal email address (e.g. Gmail, Yahoo, Outlook).');
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-enter your password.');
      return;
    }

    // Validate required legal acceptance checkbox
    if (!acceptedTerms) {
      setTermsError('You must explicitly agree to the Terms & Conditions and Privacy Policy to create your account.');
      return;
    }

    if (name && email && phone && password) {
      setLoading(true);
      const cleanedPhone = cleanNigerianPhoneForWhatsapp(phone);

      // Register with explicit selected role ('seller' for farmer, 'buyer' for buyer) and terms version
      const res = await register(name, email, cleanedPhone, role, lga, password, CURRENT_TERMS_VERSION);
      setLoading(false);

      if (res.isExisting) {
        setExistingEmailModal({
          isOpen: true,
          email: email.trim().toLowerCase(),
          message: res.error || `The email address ${email} is already registered on Benue Market.`,
        });
        return;
      }

      if (res.success) {
        // Direct routing according to the created account role
        if (role === 'seller') {
          navigate('/farmer-dashboard');
        } else {
          navigate('/buyer-dashboard');
        }
      } else if (res.error) {
        setEmailError(res.error);
      }
    }
  };

  return (
    <div className="w-full bg-[#FAF8F5] min-h-[92vh] py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-7">

        {/* Branding Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block transition-transform hover:scale-105">
            <img
              src="/logo.png"
              alt="Benue Market Logo"
              className="h-16 w-auto object-contain mx-auto drop-shadow-xs"
            />
          </Link>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-[#0F5132] text-[11px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#FEAE3A]" />
              <span>Food Basket Digital Gateway</span>
            </div>
            <h1 className="font-black text-2xl sm:text-3xl text-[#111827] tracking-tight">
              Create Your Benue Market Account
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#4B5563] max-w-md mx-auto">
              Choose whether you are joining as an agricultural <strong className="text-[#0F5132]">Farmer / Producer</strong> to sell, or a <strong className="text-[#111827]">Buyer / Merchant</strong> to source produce.
            </p>
          </div>
        </div>

        {initialEmail && (
          <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-900 font-semibold flex items-center gap-2.5 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Completing registration for <strong>{initialEmail}</strong></span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            INTERACTIVE ACCOUNT TYPE SELECTOR CARDS (Farmer vs Buyer)
            ═══════════════════════════════════════════════════════ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-black uppercase tracking-wider text-[#6B7280]">
              Select Your Role Section
            </label>
            <span className="text-[11px] font-bold text-[#0F5132]">
              {isFarmer ? '🚜 Creating: Farmer Account' : '🛒 Creating: Buyer Account'}
            </span>
          </div>

          {/* Quick Segmented Pill Switcher */}
          <div className="bg-[#EFEAE2] p-1.5 rounded-2xl flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleRoleSwitch('seller')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isFarmer
                  ? 'bg-[#0F5132] text-white shadow-md shadow-emerald-900/20'
                  : 'text-[#4B5563] hover:text-[#111827] hover:bg-white/60'
              }`}
            >
              <Sprout className="w-4 h-4" />
              <span>Farmer / Producer (Seller)</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('buyer')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !isFarmer
                  ? 'bg-[#111827] text-white shadow-md shadow-gray-950/20'
                  : 'text-[#4B5563] hover:text-[#111827] hover:bg-white/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buyer / Merchant (Customer)</span>
            </button>
          </div>

          {/* Two Detailed Interactive Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            
            {/* 1. Farmer / Producer Card */}
            <div
              onClick={() => handleRoleSwitch('seller')}
              className={`relative p-5 rounded-3xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
                isFarmer
                  ? 'bg-gradient-to-br from-[#0F5132] via-[#0B3D26] to-[#08291A] text-white border-[#0F5132] shadow-xl shadow-emerald-900/20 ring-2 ring-[#0F5132]/30 scale-[1.01]'
                  : 'bg-white text-[#111827] border-[#E8E2D9] hover:border-[#0F5132]/50 hover:bg-[#F3F8F5]'
              }`}
            >
              {isFarmer && (
                <div className="absolute top-4 right-4 bg-emerald-400 text-emerald-950 p-1.5 rounded-full shadow-sm">
                  <CheckCircle2 className="w-4 h-4 font-black" />
                </div>
              )}
              
              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-xs ${
                  isFarmer ? 'bg-emerald-800/80 text-emerald-300 ring-1 ring-emerald-700' : 'bg-emerald-50 text-[#0F5132]'
                }`}>
                  <Sprout className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-lg">Farmer / Producer</h2>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isFarmer ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-emerald-100 text-[#0F5132]'
                    }`}>
                      Seller Account
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed mt-1.5 ${isFarmer ? 'text-emerald-100/90' : 'text-[#4B5563]'}`}>
                    List harvests, sell yams, cassava, grains & livestock direct to wholesale & retail buyers across Nigeria.
                  </p>
                </div>

                {/* Farmer Perks Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    isFarmer ? 'bg-emerald-900/60 text-emerald-200' : 'bg-gray-100 text-gray-700'
                  }`}>
                    🌾 List Harvests
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    isFarmer ? 'bg-emerald-900/60 text-emerald-200' : 'bg-gray-100 text-gray-700'
                  }`}>
                    ⚡ Boost Subscriptions
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    isFarmer ? 'bg-emerald-900/60 text-emerald-200' : 'bg-gray-100 text-gray-700'
                  }`}>
                    📞 WhatsApp Orders
                  </span>
                </div>
              </div>

              <div className={`mt-4 pt-3 text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-between border-t ${
                isFarmer ? 'border-emerald-800/70 text-emerald-300' : 'border-[#E8E2D9] text-[#0F5132]'
              }`}>
                <span>{isFarmer ? '✓ Selected Section' : 'Click to select Farmer'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 2. Buyer / Merchant Card */}
            <div
              onClick={() => handleRoleSwitch('buyer')}
              className={`relative p-5 rounded-3xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
                !isFarmer
                  ? 'bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#0F172A] text-white border-[#111827] shadow-xl shadow-gray-950/20 ring-2 ring-gray-900/30 scale-[1.01]'
                  : 'bg-white text-[#111827] border-[#E8E2D9] hover:border-[#B45309]/50 hover:bg-amber-50/30'
              }`}
            >
              {!isFarmer && (
                <div className="absolute top-4 right-4 bg-amber-400 text-amber-950 p-1.5 rounded-full shadow-sm">
                  <CheckCircle2 className="w-4 h-4 font-black" />
                </div>
              )}

              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-xs ${
                  !isFarmer ? 'bg-gray-800 text-amber-400 ring-1 ring-gray-700' : 'bg-amber-50 text-amber-800'
                }`}>
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-lg">Buyer / Merchant</h2>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      !isFarmer ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Buyer Account
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed mt-1.5 ${!isFarmer ? 'text-gray-300' : 'text-[#4B5563]'}`}>
                    Source fresh produce directly from Benue farmers at farmgate rates with wholesale ordering and support.
                  </p>
                </div>

                {/* Buyer Perks Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    !isFarmer ? 'bg-gray-800 text-amber-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                    🛒 Farmgate Sourcing
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    !isFarmer ? 'bg-gray-800 text-amber-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                    🚚 Bulk Logistics
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    !isFarmer ? 'bg-gray-800 text-amber-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                    🛡️ Verified Quality
                  </span>
                </div>
              </div>

              <div className={`mt-4 pt-3 text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-between border-t ${
                !isFarmer ? 'border-gray-800 text-amber-400' : 'border-[#E8E2D9] text-amber-800'
              }`}>
                <span>{!isFarmer ? '✓ Selected Section' : 'Click to select Buyer'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            MAIN REGISTRATION FORM CONTAINER
            ═══════════════════════════════════════════════════════ */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D9] shadow-xl space-y-6">
          
          {/* Active Confirmation Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            isFarmer 
              ? 'bg-emerald-50/90 border-emerald-300 text-[#0F5132]' 
              : 'bg-amber-50/90 border-amber-300 text-amber-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isFarmer ? 'bg-[#0F5132] text-white' : 'bg-[#111827] text-amber-400'
              }`}>
                {isFarmer ? <Sprout className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-black text-sm">
                  {isFarmer ? '🚜 Creating a Verified Farmer / Seller Account' : '🛒 Creating a Buyer / Merchant Account'}
                </h3>
                <p className="text-[11px] opacity-85">
                  {isFarmer 
                    ? 'You will have full authorization to list produce, activate subscriptions, and receive orders.' 
                    : 'You will have access to browse farmgate catalogs, contact farmers, and place wholesale inquiries.'}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shrink-0 ${
              isFarmer ? 'bg-white text-[#0F5132] border-emerald-300' : 'bg-white text-gray-900 border-amber-300'
            }`}>
              {isFarmer ? 'Farmer Portal' : 'Buyer Portal'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827] flex items-center justify-between">
                <span>{isFarmer ? 'Farmer / Farm Enterprise Name' : 'Buyer / Full Name / Business Name'}</span>
                <span className="text-[10px] text-gray-400 font-normal">Required</span>
              </label>
              <input
                type="text"
                required
                placeholder={isFarmer ? 'e.g. Ter-Anyam Yam & Grain Farm, Zaki Biam' : 'e.g. Agro-Merchants Hub Lagos, or John Doe'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-medium"
              />
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827] flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] text-gray-400 font-normal">Gmail, Yahoo, Outlook</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-medium"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {emailError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            {/* Phone Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827] flex items-center justify-between">
                <span>Phone Number (Calls & Direct WhatsApp)</span>
                <span className="text-[10px] text-gray-400 font-normal">Nigerian mobile number</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="08031234567 or 08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-medium"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Benue LGA Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0F5132]" />
                  <span>{isFarmer ? 'Farm Location (Benue LGA)' : 'Preferred Trading Hub / LGA'}</span>
                </label>
                <select
                  value={lga}
                  onChange={(e) => setLga(e.target.value as BenueLGA)}
                  className="w-full px-3 py-3 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] font-semibold"
                >
                  {BENUE_LGAS.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name} LGA ({item.majorMarket})
                    </option>
                  ))}
                </select>
              </div>

              {/* Extra context field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827]">
                  {isFarmer ? 'Primary Harvest Specialization' : 'Primary Produce Sourced'}
                </label>
                <select
                  value={farmProduceCategory}
                  onChange={(e) => setFarmProduceCategory(e.target.value)}
                  className="w-full px-3 py-3 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs sm:text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] font-semibold"
                >
                  <option value="Tubers (Yams & Cassava)">Tubers (Yams, Cassava, Sweet Potatoes)</option>
                  <option value="Grains & Cereals (Rice & Maize)">Grains & Cereals (Rice, Maize, Sorghum)</option>
                  <option value="Legumes & Oilseeds (Soya Beans & Groundnuts)">Legumes & Oilseeds (Soya Beans, Groundnuts)</option>
                  <option value="Citrus & Fruits (Oranges & Mangoes)">Citrus & Fruits (Oranges, Mangoes)</option>
                  <option value="Vegetables & Peppers">Vegetables, Tomatoes & Fresh Peppers</option>
                  <option value="Livestock & Poultry">Livestock, Goats, Cattle & Poultry</option>
                  <option value="Fish & Aquaculture">Fresh & Smoked Fish</option>
                </select>
              </div>
            </div>

            {/* Create Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827] flex items-center justify-between">
                <span>Create Secure Password</span>
                <span className="text-[10px] text-gray-400 font-normal">Min 6 characters</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Enter a strong password"
                  className="w-full pl-10 pr-10 py-3 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-mono"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827]">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Re-enter password to confirm"
                  className="w-full pl-10 pr-10 py-3 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-mono"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Validation Error */}
            {passwordError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Password Security Indicators */}
            {password.length > 0 && (
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className={`flex items-center gap-1.5 ${isMinLength ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${isMinLength ? 'text-emerald-600' : 'text-gray-300'}`} />
                  <span>6+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${isMatch ? 'text-emerald-600' : 'text-gray-300'}`} />
                  <span>Passwords match</span>
                </div>
              </div>
            )}

            {/* Required Terms & Conditions Agreement Checkbox */}
            <div className={`p-4 rounded-2xl border transition-all ${
              termsError
                ? 'bg-red-50/70 border-red-300 ring-2 ring-red-500/20'
                : acceptedTerms
                ? 'bg-[#E8F5E9]/60 border-[#C8E6C9]'
                : 'bg-[#FAF8F5] border-[#D6CDC0]'
            }`}>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="register-terms-agreement"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (termsError) setTermsError(null);
                  }}
                  className="mt-1 w-4 h-4 rounded text-[#0F5132] focus:ring-[#0F5132] border-[#D6CDC0] cursor-pointer shrink-0 accent-[#0F5132]"
                />
                <span className="text-xs text-[#374151] leading-relaxed">
                  I have read and explicitly agree to Benue Market's{' '}
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-black text-[#0F5132] underline hover:text-[#0B3D26]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms & Conditions
                  </Link>
                  {', '}
                  <Link
                    to="/terms?tab=privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-black text-[#0F5132] underline hover:text-[#0B3D26]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </Link>
                  {', and '}
                  <Link
                    to={isFarmer ? '/terms?tab=farmer' : '/terms?tab=buyer'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-black text-[#0F5132] underline hover:text-[#0B3D26]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isFarmer ? 'Farmer / Seller Rules' : 'Buyer Conduct Standards'}
                  </Link>
                  . I understand that Benue Market directly connects farmers and buyers with 0% commission, and all harvest negotiations and off-platform payments are conducted directly between transacting parties.
                </span>
              </label>

              {termsError && (
                <div className="mt-2.5 pt-2 border-t border-red-200 text-xs text-red-700 font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>{termsError}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-black text-sm py-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                isFarmer
                  ? 'bg-[#0F5132] hover:bg-[#0B3D26] text-white shadow-emerald-900/15'
                  : 'bg-[#111827] hover:bg-black text-white shadow-gray-950/15'
              }`}
            >
              {loading ? (
                <span>Creating {isFarmer ? 'Farmer' : 'Buyer'} Account...</span>
              ) : (
                <>
                  {isFarmer ? <Sprout className="w-4 h-4 text-[#FEAE3A]" /> : <ShoppingBag className="w-4 h-4 text-amber-400" />}
                  <span>
                    {isFarmer
                      ? 'Create Farmer Account & Launch Portal'
                      : 'Create Buyer Account & Start Sourcing'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-[#4B5563] pt-3 border-t border-[#E8E2D9] flex items-center justify-between">
            <span>
              Already registered?{' '}
              <Link to="/login" className="font-bold text-[#0F5132] hover:underline">
                Sign In Here
              </Link>
            </span>
            <Link to="/contact" className="font-medium text-gray-500 hover:text-[#0F5132]">
              Need Help?
            </Link>
          </div>
        </div>
      </div>

      {/* Duplicate Account Alert Modal */}
      {existingEmailModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl w-full max-w-md overflow-hidden relative p-6 sm:p-8 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-extrabold text-xl text-[#111827]">Account Already Exists</h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                The email address <strong className="text-[#111827]">{existingEmailModal.email}</strong> is already registered on Benue Market.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/login?email=${encodeURIComponent(existingEmailModal.email)}`)}
                className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Sign In to Existing Account</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(existingEmailModal.email)}`)}
                className="w-full bg-[#FAF8F5] hover:bg-[#E8E2D9] text-[#111827] font-bold text-xs py-3 rounded-xl border border-[#D6CDC0] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-[#0F5132]" />
                <span>Reset Forgot Password</span>
              </button>
            </div>

            <button
              onClick={() => setExistingEmailModal({ isOpen: false, email: '', message: '' })}
              className="w-full text-xs font-bold text-[#4B5563] hover:text-[#111827] pt-2 cursor-pointer"
            >
              Use a Different Email Address
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

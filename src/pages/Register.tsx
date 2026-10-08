import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, UserCheck, KeyRound, Sparkles, Eye, EyeOff, Check, Sprout, ShoppingBag, CheckCircle2, ArrowRight } from 'lucide-react';
import type { UserRole, BenueLGA } from '../types';
import { useAuth } from '../context/AuthContext';
import { BENUE_LGAS } from '../constants/benue';
import { cleanNigerianPhoneForWhatsapp } from '../utils/formatters';
import { validatePersonalEmail } from '../utils/emailValidator';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const paramRole = searchParams.get('role');
  
  // Map 'farmer' query param to 'seller' role
  const resolvedInitialRole: UserRole = (paramRole === 'farmer' || paramRole === 'seller') ? 'seller' : 'buyer';

  const { register } = useAuth();
  const [role, setRole] = useState<UserRole>(resolvedInitialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [lga, setLga] = useState<BenueLGA>('Makurdi');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setPasswordError(null);

    // Validate personal email address
    const validation = validatePersonalEmail(email);
    if (!validation.isValid) {
      setEmailError(validation.error || 'Please enter a valid, active personal email address.');
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-enter.');
      return;
    }

    if (name && email && phone && password) {
      setLoading(true);
      const cleanedPhone = cleanNigerianPhoneForWhatsapp(phone);

      // Register with explicit selected role ('seller' or 'buyer')
      const res = await register(name, email, cleanedPhone, role, lga, password);
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
        navigate(role === 'seller' ? '/farmer-dashboard' : '/buyer-dashboard');
      }
    }
  };

  const isFarmer = role === 'seller';

  return (
    <div className="w-full bg-[#FAF8F5] min-h-[90vh] py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-xl space-y-6">

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
            <h1 className="font-black text-2xl sm:text-3xl text-[#111827] tracking-tight">
              Create Your Benue Market Account
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#4B5563]">
              Select your account section below to get started on Nigeria's Food Basket portal
            </p>
          </div>
        </div>

        {initialEmail && (
          <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-900 font-semibold flex items-center gap-2.5 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Complete your registration for <strong>{initialEmail}</strong></span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            ACCOUNT TYPE SECTION SWITCHER (Farmer vs Buyer)
            ═══════════════════════════════════════════════════════ */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-[#6B7280] text-center">
            Choose Your Account Section
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Farmer / Producer Card */}
            <button
              type="button"
              onClick={() => handleRoleSwitch('seller')}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isFarmer
                  ? 'bg-[#0F5132] text-white border-[#0F5132] shadow-lg shadow-emerald-900/15 scale-[1.02]'
                  : 'bg-white text-[#111827] border-[#E8E2D9] hover:border-[#0F5132]/40 hover:bg-[#F3F8F5]'
              }`}
            >
              {isFarmer && (
                <div className="absolute top-3 right-3 bg-emerald-400 text-emerald-950 p-1 rounded-full shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              <div className="space-y-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  isFarmer ? 'bg-emerald-800 text-emerald-300' : 'bg-emerald-50 text-[#0F5132]'
                }`}>
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-extrabold text-base">Farmer / Producer</h2>
                  </div>
                  <p className={`text-[11px] leading-snug mt-0.5 ${isFarmer ? 'text-emerald-100' : 'text-gray-500'}`}>
                    Sell crops, yam, cassava, grains & livestock direct to buyers.
                  </p>
                </div>
              </div>
              <div className={`mt-3 pt-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border-t ${
                isFarmer ? 'border-emerald-800 text-emerald-300' : 'border-gray-100 text-[#0F5132]'
              }`}>
                <span>Farmer Account Section</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>

            {/* Buyer / Merchant Card */}
            <button
              type="button"
              onClick={() => handleRoleSwitch('buyer')}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                !isFarmer
                  ? 'bg-[#111827] text-white border-[#111827] shadow-lg shadow-gray-950/15 scale-[1.02]'
                  : 'bg-white text-[#111827] border-[#E8E2D9] hover:border-[#B45309]/40 hover:bg-amber-50/40'
              }`}
            >
              {!isFarmer && (
                <div className="absolute top-3 right-3 bg-amber-400 text-amber-950 p-1 rounded-full shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              <div className="space-y-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  !isFarmer ? 'bg-gray-800 text-amber-400' : 'bg-amber-50 text-amber-700'
                }`}>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-extrabold text-base">Buyer / Merchant</h2>
                  </div>
                  <p className={`text-[11px] leading-snug mt-0.5 ${!isFarmer ? 'text-gray-300' : 'text-gray-500'}`}>
                    Source fresh produce at wholesale prices directly from farmers.
                  </p>
                </div>
              </div>
              <div className={`mt-3 pt-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border-t ${
                !isFarmer ? 'border-gray-800 text-amber-400' : 'border-gray-100 text-amber-700'
              }`}>
                <span>Buyer Account Section</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            MAIN REGISTRATION FORM CARD
            ═══════════════════════════════════════════════════════ */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D9] shadow-xl space-y-6">
          
          {/* Header Indicator inside form */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isFarmer 
              ? 'bg-emerald-50/80 border-emerald-200 text-[#0F5132]' 
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isFarmer ? 'bg-[#0F5132] text-white' : 'bg-amber-700 text-white'
              }`}>
                {isFarmer ? <Sprout className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm">
                  {isFarmer ? 'Registering as Farmer / Seller' : 'Registering as Buyer / Merchant'}
                </h3>
                <p className="text-[11px] opacity-80">
                  {isFarmer ? 'Account role: Farmer (Produces & Sells Produce)' : 'Account role: Buyer (Orders & Purchases Produce)'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/80 border border-current">
              {isFarmer ? 'Farmer' : 'Buyer'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827]">
                {isFarmer ? 'Farmer / Farm Business Name' : 'Full Name / Business Name'}
              </label>
              <input
                type="text"
                required
                placeholder={isFarmer ? 'e.g. Ter-Anyam Yam Farm' : 'e.g. John Doe'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
              />
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827]">Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. name@gmail.com, name@yahoo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
              />
              {emailError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            {/* Phone Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827]">Phone Number (Call & WhatsApp)</label>
              <input
                type="tel"
                required
                placeholder="08031234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
              />
            </div>

            {/* LGA Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827]">Benue LGA Location</label>
              <select
                value={lga}
                onChange={(e) => setLga(e.target.value as BenueLGA)}
                className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132]"
              >
                {BENUE_LGAS.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} LGA
                  </option>
                ))}
              </select>
            </div>

            {/* Create Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#111827]">Create Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Min 6 characters"
                  className="w-full pl-4 pr-10 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#9CA3AF] hover:text-[#111827]"
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
                  placeholder="Re-enter password"
                  className="w-full pl-4 pr-10 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-[#9CA3AF] hover:text-[#111827]"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-black text-sm py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                isFarmer
                  ? 'bg-[#0F5132] hover:bg-[#0B3D26] text-white shadow-emerald-900/10'
                  : 'bg-[#111827] hover:bg-black text-white shadow-gray-950/10'
              }`}
            >
              {loading ? (
                <span>Creating {isFarmer ? 'Farmer' : 'Buyer'} Account...</span>
              ) : (
                <>
                  <span>Create {isFarmer ? 'Farmer' : 'Buyer'} Account & Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-[#4B5563] pt-3 border-t border-[#E8E2D9]">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#0F5132] hover:underline">
              Sign In Here
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
                className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Sign In to Existing Account</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(existingEmailModal.email)}`)}
                className="w-full bg-[#FAF8F5] hover:bg-[#E8E2D9] text-[#111827] font-bold text-xs py-3 rounded-xl border border-[#D6CDC0] transition-all flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-[#0F5132]" />
                <span>Reset Forgot Password</span>
              </button>
            </div>

            <button
              onClick={() => setExistingEmailModal({ isOpen: false, email: '', message: '' })}
              className="w-full text-xs font-bold text-[#4B5563] hover:text-[#111827] pt-2"
            >
              Use a Different Email Address
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

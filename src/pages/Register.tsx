import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, UserCheck, KeyRound, Sparkles, Eye, EyeOff, Check } from 'lucide-react';
import type { UserRole, BenueLGA } from '../types';
import { useAuth } from '../context/AuthContext';
import { BENUE_LGAS } from '../constants/benue';
import { cleanNigerianPhoneForWhatsapp } from '../utils/formatters';
import { validatePersonalEmail } from '../utils/emailValidator';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const initialRole = (searchParams.get('role') as UserRole) || 'seller';

  const { register } = useAuth();
  const [role, setRole] = useState<UserRole>(initialRole);
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
    if (initialRole) setRole(initialRole);
  }, [initialEmail, initialRole]);

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

  return (
    <div className="w-full bg-[#FBF9F6] min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl border border-[#E8E2D9] shadow-sm w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/logo.png"
            alt="Benue Market Logo"
            className="h-14 w-auto object-contain mx-auto"
          />
          <h1 className="font-extrabold text-2xl text-[#111827]">Join Benue Market</h1>
          <p className="text-xs text-[#4B5563]">Create a free account to buy or sell produce</p>
        </div>

        {initialEmail && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Complete registration below to get started with <strong>{initialEmail}</strong></span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">I am joining as a:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                  role === 'seller'
                    ? 'bg-[#0F5132] text-white border-[#0F5132] shadow-sm'
                    : 'bg-[#F9FAFB] text-[#374151] border-[#D6CDC0] hover:bg-[#F3F4F6]'
                }`}
              >
                Farmer / Producer
              </button>
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                  role === 'buyer'
                    ? 'bg-[#0F5132] text-white border-[#0F5132] shadow-sm'
                    : 'bg-[#F9FAFB] text-[#374151] border-[#D6CDC0] hover:bg-[#F3F4F6]'
                }`}
              >
                Buyer / Merchant
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">Full Name / Business Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ter-Anyam Union"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">Email Address (Personal / Business)</label>
            <input
              type="email"
              required
              placeholder="e.g. name@gmail.com, name@yahoo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            />
            {emailError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{emailError}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">Phone Number (Call & WhatsApp)</label>
            <input
              type="tel"
              required
              placeholder="08031234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">Benue LGA Location</label>
            <select
              value={lga}
              onChange={(e) => setLga(e.target.value as BenueLGA)}
              className="w-full px-3 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132]"
            >
              {BENUE_LGAS.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name} LGA
                </option>
              ))}
            </select>
          </div>

          {/* Password Field */}
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
                className="w-full pl-4 pr-10 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-mono"
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

          {/* Confirm Password Field */}
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
                className="w-full pl-4 pr-10 py-2.5 bg-[#FBF9F6] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-mono"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold text-sm py-3 rounded-xl shadow-sm transition-colors active:scale-[0.98]"
          >
            {loading ? 'Creating Account...' : 'Create Account & Get Started'}
          </button>
        </form>

        <div className="text-center text-xs text-[#4B5563] pt-2 border-t border-[#E8E2D9]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#0F5132] hover:underline">
            Sign In
          </Link>
        </div>
      </div>

      {/* Duplicate Account Alert Popup Modal */}
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

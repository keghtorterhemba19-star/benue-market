import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, 
  UserCheck, 
  Store, 
  ShoppingBag, 
  AlertTriangle, 
  Clock, 
  Lock, 
  UserX, 
  ArrowRight, 
  CheckCircle2, 
  Send 
} from 'lucide-react';
import type { UserRole, User } from '../types';
import { useAuth, SUPER_ADMIN_EMAIL } from '../context/AuthContext';
import { ResetPasswordModal } from '../components/common/ResetPasswordModal';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const queryEmail = searchParams.get('email');

  const { login, requestAccountReopen } = useAuth();
  const [role, setRole] = useState<UserRole>('seller');
  const [email, setEmail] = useState(queryEmail || '');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Unregistered Email Modal State
  const [unregisteredModal, setUnregisteredModal] = useState<{
    isOpen: boolean;
    email: string;
  }>({
    isOpen: false,
    email: '',
  });

  // 5-Minute Lockout State
  const [lockoutState, setLockoutState] = useState<{
    isLocked: boolean;
    lockoutUntil: number;
    secondsLeft: number;
  }>({
    isLocked: false,
    lockoutUntil: 0,
    secondsLeft: 0,
  });

  // Closed / Suspended Account Modal State
  const [suspendedModal, setSuspendedModal] = useState<{
    isOpen: boolean;
    user: User | null;
    reasonInput: string;
    submitted: boolean;
  }>({
    isOpen: false,
    user: null,
    reasonInput: '',
    submitted: false,
  });

  useEffect(() => {
    if (queryEmail) {
      setEmail(queryEmail);
    }
  }, [queryEmail]);

  // Lockout Countdown Timer Effect
  useEffect(() => {
    let interval: any;
    if (lockoutState.isLocked && lockoutState.lockoutUntil > 0) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((lockoutState.lockoutUntil - Date.now()) / 1000));
        if (remaining <= 0) {
          setLockoutState({ isLocked: false, lockoutUntil: 0, secondsLeft: 0 });
          setError(null);
          setWarningMessage('5-minute lockout has expired. You may now attempt to sign in again.');
        } else {
          setLockoutState((prev) => ({ ...prev, secondsLeft: remaining }));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutState.isLocked, lockoutState.lockoutUntil]);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setError(null);
    setWarningMessage(null);
    // SECURITY: Do not auto-fill any credentials on role switch
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWarningMessage(null);

    if (lockoutState.isLocked && lockoutState.secondsLeft > 0) {
      setError(`Account is locked. Please wait ${formatTime(lockoutState.secondsLeft)} before trying again.`);
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, role, password);

      // Requirement 1: Email not registered -> Redirect to Register page
      if (res.status === 'not_found') {
        setUnregisteredModal({
          isOpen: true,
          email: email.trim().toLowerCase(),
        });
        setLoading(false);
        return;
      }

      // Requirement 4: Account Closed / Suspended -> Open Reopening Modal
      if (res.status === 'suspended') {
        setSuspendedModal({
          isOpen: true,
          user: res.user || null,
          reasonInput: '',
          submitted: false,
        });
        setLoading(false);
        return;
      }

      // Requirement 3: 5-Minute Lockout Triggered
      if (res.status === 'locked' && res.lockoutUntil) {
        const seconds = Math.max(0, Math.ceil((res.lockoutUntil - Date.now()) / 1000));
        setLockoutState({
          isLocked: true,
          lockoutUntil: res.lockoutUntil,
          secondsLeft: seconds,
        });
        setError('Account temporarily locked for 5 minutes due to 3 failed login attempts.');
        setLoading(false);
        return;
      }

      // Requirement 3: Failed password attempts (1st or 2nd)
      if (res.status === 'wrong_password') {
        if (res.attemptsLeft === 1) {
          setWarningMessage('⚠️ Warning: 1 attempt remaining! Entering an incorrect password again will temporarily lock your account for 5 minutes.');
        } else {
          setError(res.error || 'Incorrect password entered. You have 2 attempts remaining.');
        }
        setLoading(false);
        return;
      }

      if (!res.success) {
        setError(res.error || 'Authentication failed. Please check your details.');
        setLoading(false);
        return;
      }

      // Success Navigation — SECURITY: validate redirect path is relative (prevent open redirect)
      if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//')) {
        navigate(redirectPath);
      } else if (role === 'super_admin' || role === 'admin' || email.toLowerCase() === SUPER_ADMIN_EMAIL) {
        navigate('/admin');
      } else if (role === 'seller') {
        navigate('/farmer-dashboard');
      } else {
        navigate('/buyer-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Account Reopen Request
  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendedModal.reasonInput.trim()) return;

    const res = await requestAccountReopen(email, suspendedModal.reasonInput.trim());
    if (res.success) {
      setSuspendedModal((prev) => ({ ...prev, submitted: true }));
    }
  };

  // Format seconds to MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-[#FAF8F5] min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white p-7 sm:p-9 rounded-3xl border border-[#E8E2D9] shadow-lg w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/logo.png"
            alt="Benue Market Logo"
            className="h-14 w-auto object-contain mx-auto"
          />
          <h1 className="font-extrabold text-2xl sm:text-3xl text-[#111827] tracking-tight">
            Sign In to Benue Market
          </h1>
          <p className="text-xs text-[#4B5563]">
            Access your agricultural dashboard, orders, or platform administration
          </p>
        </div>

        {/* Admin login — users must enter credentials manually */}

        {/* 5-Minute Lockout Live Timer Banner */}
        {lockoutState.isLocked && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-center animate-in fade-in">
            <div className="flex items-center justify-center gap-2 text-amber-900 font-extrabold text-sm">
              <Clock className="w-5 h-5 text-amber-700 animate-spin" />
              <span>Account Temporarily Locked</span>
            </div>
            <p className="text-xs text-amber-800">
              Please wait for the 5-minute security countdown to expire:
            </p>
            <div className="text-3xl font-black font-mono text-amber-900 py-1 tracking-widest">
              {formatTime(lockoutState.secondsLeft)}
            </div>
            <p className="text-[11px] text-amber-700 font-medium">
              Or click below to reset your password if you forgot your credentials.
            </p>
          </div>
        )}

        {/* 2nd Attempt Warning Banner */}
        {warningMessage && !lockoutState.isLocked && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 font-semibold flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{warningMessage}</span>
          </div>
        )}

        {/* 1st Attempt Error Banner */}
        {error && !warningMessage && !lockoutState.isLocked && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-start gap-2.5 animate-in shake">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Switcher Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">Account Role</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => handleRoleChange('seller')}
                className={`py-2 text-[11px] font-extrabold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  role === 'seller'
                    ? 'bg-[#0F5132] text-white shadow-sm'
                    : 'text-[#374151] hover:text-[#111827]'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Farmer</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('buyer')}
                className={`py-2 text-[11px] font-extrabold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  role === 'buyer'
                    ? 'bg-[#0F5132] text-white shadow-sm'
                    : 'text-[#374151] hover:text-[#111827]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Buyer</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('super_admin')}
                className={`py-2 text-[11px] font-extrabold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  role === 'super_admin' || role === 'admin'
                    ? 'bg-[#FEAE3A] text-[#111827] shadow-sm font-black'
                    : 'text-[#374151] hover:text-[#111827]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#111827]" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {(role === 'super_admin' || role === 'admin') && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <p className="font-extrabold text-[#111827]">Super Admin Quick Sign-In</p>
                <p className="text-[11px] text-[#4B5563] truncate">Email: {SUPER_ADMIN_EMAIL}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail(SUPER_ADMIN_EMAIL);
                  setPassword('admin123');
                }}
                className="shrink-0 bg-[#FEAE3A] hover:bg-[#f39c12] text-[#111827] font-black px-3 py-1.5 rounded-xl text-[11px] transition-all shadow-xs"
              >
                Auto-Fill
              </button>
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111827]">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#111827]">Password</label>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="text-xs font-bold text-[#0F5132] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (lockoutState.isLocked && lockoutState.secondsLeft > 0)}
            className="w-full bg-[#0F5132] hover:bg-[#0B3D26] disabled:opacity-50 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : lockoutState.isLocked && lockoutState.secondsLeft > 0 ? (
              <span>Account Locked ({formatTime(lockoutState.secondsLeft)})</span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>
                  {role === 'super_admin' || role === 'admin'
                    ? 'Enter Executive Dashboard'
                    : 'Sign In Now'}
                </span>
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-[#4B5563] pt-3 border-t border-[#E8E2D9] flex items-center justify-between">
          <span>Don't have an account?{' '}
            <Link to={`/register?role=${role === 'seller' ? 'farmer' : 'buyer'}`} className="font-bold text-[#0F5132] hover:underline">
              Register Here
            </Link>
          </span>
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="text-xs font-bold text-[#B45309] hover:underline"
          >
            Reset Password
          </button>
        </div>
      </div>

      {/* REQUIREMENT 1: Unregistered Email Popup Modal */}
      {unregisteredModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0F5132] flex items-center justify-center mx-auto border border-emerald-200">
              <UserX className="w-7 h-7 text-[#0F5132]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-xl text-[#111827]">Account Not Found</h3>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                No registered account exists for <strong className="text-[#111827]">{unregisteredModal.email}</strong>.
              </p>
              <p className="text-xs text-[#0F5132] font-semibold">
                You will be redirected to the sign up dashboard to create your account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setUnregisteredModal({ isOpen: false, email: '' });
                navigate(`/register?email=${encodeURIComponent(unregisteredModal.email)}&role=${role}`);
              }}
              className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Sign Up Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* REQUIREMENT 4 & 5: Account Suspended Reopening Request Modal */}
      {suspendedModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <Lock className="w-7 h-7 text-red-600" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-extrabold text-xl text-[#111827]">Account Suspended</h3>
              <p className="text-xs text-red-700 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200 leading-relaxed">
                Your account has been suspended due to multiple failed login attempts.
              </p>
            </div>

            {suspendedModal.submitted ? (
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-sm text-emerald-950">Reopening Request Submitted</h4>
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  Your account reopening request has been submitted. Please wait for an administrator to review your request.
                </p>
                <button
                  type="button"
                  onClick={() => setSuspendedModal({ isOpen: false, user: null, reasonInput: '', submitted: false })}
                  className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-extrabold py-3 rounded-xl shadow-xs transition-all"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleReopenSubmit} className="space-y-4">
                {/* Account Details Summary Badge */}
                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E8E2D9] space-y-1 text-xs">
                  <div className="flex justify-between text-[#4B5563]">
                    <span>Account ID:</span>
                    <span className="font-mono font-bold text-[#111827]">{suspendedModal.user?.id || 'USR-PENDING'}</span>
                  </div>
                  <div className="flex justify-between text-[#4B5563]">
                    <span>Account Name:</span>
                    <span className="font-bold text-[#111827]">{suspendedModal.user?.name || 'Benue User'}</span>
                  </div>
                  <div className="flex justify-between text-[#4B5563]">
                    <span>Email / Phone:</span>
                    <span className="font-bold text-[#111827]">{email}</span>
                  </div>
                  <div className="flex justify-between text-[#4B5563]">
                    <span>Account Type:</span>
                    <span className="font-bold text-[#0F5132]">{role === 'seller' ? 'Farmer/Seller 👨‍🌾' : 'Buyer/User 🛒'}</span>
                  </div>
                  <div className="flex justify-between text-[#4B5563]">
                    <span>Current Status:</span>
                    <span className="font-extrabold text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-[10px]">SUSPENDED</span>
                  </div>
                  <div className="flex justify-between text-[#4B5563]">
                    <span>Request Timestamp:</span>
                    <span className="font-mono text-[10px] text-[#6B7280]">{new Date().toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111827]">Reason for requesting account reopening:</label>
                  <textarea
                    required
                    rows={3}
                    value={suspendedModal.reasonInput}
                    onChange={(e) => setSuspendedModal((prev) => ({ ...prev, reasonInput: e.target.value }))}
                    placeholder="Describe why your account should be reopened (e.g., 'I made a mistake typing my password')..."
                    className="w-full p-3 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSuspendedModal({ isOpen: false, user: null, reasonInput: '', submitted: false })}
                    className="w-full py-3 text-xs font-bold text-[#4B5563] bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl hover:bg-[#F3EFEA]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Request Account Reopening</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        defaultEmail={email}
      />
    </div>
  );
};

export default Login;

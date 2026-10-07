import React, { useState, useEffect } from 'react';
import { 
  X, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Mail, 
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Check,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { maskEmail } from '../../utils/otpSecurity';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onSuccess?: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  onSuccess,
}) => {
  const { requestPasswordReset, verifyResetOtp, resetPassword } = useAuth();
  
  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [step, setStep] = useState<'request' | 'verify' | 'new_password' | 'success'>('request');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [inAppOtp, setInAppOtp] = useState<string | null>(null);

  // Resend cooldown timer
  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setInterval(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  if (!isOpen) return null;

  // Request Confirmation Email or In-App OTP
  const handleRequestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(cleanEmail);
      if (!res.success) {
        setError(res.error || "We couldn't send the verification code. Please try again.");
        setLoading(false);
        return;
      }

      // If email failed but OTP was returned for in-app display
      if (res.inAppOtp) {
        setInAppOtp(res.inAppOtp);
      } else {
        setInAppOtp(null);
      }

      setStep('verify');
      setResendCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Error requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Verification Code
  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setResendCountdown(60);
        if (res.inAppOtp) {
          setInAppOtp(res.inAppOtp);
        }
      } else {
        setError(res.error || "Failed to resend verification code.");
      }
    } catch (err: any) {
      setError('Error resending verification code.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Input handler
  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);

    if (val && idx < 5) {
      const nextEl = document.getElementById(`modal-otp-${idx + 1}`);
      if (nextEl) nextEl.focus();
    }
  };

  // Handle Backspace navigation
  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      const prevEl = document.getElementById(`modal-otp-${idx - 1}`);
      if (prevEl) prevEl.focus();
    }
  };

  // Handle Clipboard Paste for 6-Digit OTP Code
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''));
      const lastInput = document.getElementById(`modal-otp-5`);
      if (lastInput) lastInput.focus();
    }
  };

  // Verify OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the confirmation code.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyResetOtp(email, code);
      if (!res.success) {
        setError(res.error || 'Invalid verification code. Please check your email and try again.');
        setLoading(false);
        return;
      }
      setStep('new_password');
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Password criteria validation
  const isMinLength = newPassword.length >= 6;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Reset Password Submit
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isMinLength) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(email, newPassword);
      if (!res.success) {
        setError(res.error || 'Failed to reset password.');
        setLoading(false);
        return;
      }

      setStep('success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error executing password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail(defaultEmail);
    setOtp(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setStep('request');
    setError(null);
    setInAppOtp(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-2xl w-full max-w-md overflow-hidden relative">
        {/* Header */}
        <div className="bg-[#0F5132] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg text-[#FEF3C7]">
              <KeyRound className="w-5 h-5 text-[#FEF3C7]" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg">Reset Account Password</h3>
              <p className="text-xs text-[#C8E6C9]">Email Verification & Recovery</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: REQUEST EMAIL */}
          {step === 'request' && (
            <form onSubmit={handleRequestEmail} className="space-y-4">
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Enter your registered Benue Market email address below. We will send a 6-digit verification code to your email inbox.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827]">Account Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. farmer@benuemarket.ng"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 text-xs font-bold text-[#4B5563] hover:text-[#111827]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  {loading ? 'Sending Code...' : 'Send Verification Code'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFY CODE (Email or In-App) */}
          {step === 'verify' && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                {inAppOtp ? (
                  /* In-App OTP Mode: Show code directly on screen */
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto shadow-sm relative border border-amber-200">
                      <Smartphone className="w-7 h-7 text-amber-700" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-white animate-pulse" />
                    </div>
                    <h4 className="font-extrabold text-base text-[#111827]">Your Verification Code</h4>
                    <p className="text-xs text-[#4B5563] max-w-xs mx-auto leading-relaxed">
                      No email provider is configured. Your 6-digit code is shown below.
                      Enter it in the fields to proceed.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-2">
                      <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">Your Reset Code</p>
                      <div className="font-mono text-3xl font-black text-[#0F5132] tracking-[0.35em] select-all">
                        {inAppOtp}
                      </div>
                      <p className="text-[10px] text-amber-700 mt-2">⏱️ This code expires in 10 minutes</p>
                    </div>
                  </>
                ) : (
                  /* Email Mode: Tell user to check inbox */
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] text-[#0F5132] flex items-center justify-center mx-auto shadow-sm relative">
                      <Mail className="w-7 h-7 text-[#0F5132]" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white animate-pulse" />
                    </div>
                    <h4 className="font-extrabold text-base text-[#111827]">Check Your Personal Email</h4>
                    <p className="text-xs text-[#4B5563] max-w-xs mx-auto leading-relaxed">
                      We dispatched a 6-digit verification code to your email <br />
                      <strong className="text-[#111827] font-semibold">{maskEmail(email)}</strong>
                    </p>
                  </>
                )}
              </div>

              {/* OTP Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
                <div className="space-y-1.5 text-center">
                  <label className="text-xs font-bold text-[#111827]">Enter 6-Digit Verification Code</label>
                  {!inAppOtp && (
                    <p className="text-[11px] text-[#6B7280]">Check your inbox or spam folder for the code</p>
                  )}
                  <div className="flex items-center justify-center gap-1.5 pt-2">
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        id={`modal-otp-${i}`}
                        type="text"
                        maxLength={1}
                        value={d}
                        onChange={(e) => handleOtpChange(e.target.value, i)}
                        onKeyDown={(e) => handleOtpKeyDown(e, i)}
                        onPaste={handleOtpPaste}
                        className="w-10 h-11 text-center text-lg font-black text-[#111827] bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-mono"
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-[#E8E2D9]">
                  <button
                    type="button"
                    onClick={() => { setStep('request'); setInAppOtp(null); }}
                    className="text-[#4B5563] font-bold hover:text-[#111827]"
                  >
                    Change Email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCountdown > 0 || loading}
                    className={`font-bold flex items-center gap-1 ${
                      resendCountdown > 0 ? 'text-[#9CA3AF]' : 'text-[#0F5132] hover:underline'
                    }`}
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>{resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'New Code'}</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition-all"
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: SET NEW PASSWORD */}
          {step === 'new_password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827]">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#9CA3AF] hover:text-[#111827]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827]">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-[#9CA3AF] hover:text-[#111827]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password checks */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#4B5563]">
                <div className={`flex items-center gap-1 ${isMinLength ? 'text-emerald-700 font-bold' : ''}`}>
                  <Check className="w-3 h-3" /> 6+ characters
                </div>
                <div className={`flex items-center gap-1 ${hasUppercase ? 'text-emerald-700 font-bold' : ''}`}>
                  <Check className="w-3 h-3" /> Uppercase
                </div>
                <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-700 font-bold' : ''}`}>
                  <Check className="w-3 h-3" /> Number
                </div>
                <div className={`flex items-center gap-1 ${isMatch ? 'text-emerald-700 font-bold' : ''}`}>
                  <Check className="w-3 h-3" /> Passwords match
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="px-4 py-2.5 text-xs font-bold text-[#4B5563] hover:text-[#111827]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  {loading ? 'Updating...' : 'Save New Password'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-[#E8F5E9] text-[#0F5132] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
              </div>
              <h4 className="font-extrabold text-lg text-[#111827]">Password Reset Successful!</h4>
              <p className="text-xs text-[#4B5563]">
                Your account password has been updated. A security notification email has been dispatched to <strong>{maskEmail(email)}</strong>.
              </p>
              <button
                onClick={handleClose}
                className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all"
              >
                Return to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

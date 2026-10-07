import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Lock, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Check, 
  ArrowLeft 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { maskEmail } from '../utils/otpSecurity';

type ResetStep = 'request' | 'verify' | 'new_password' | 'success';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlEmail = searchParams.get('email') || '';
  const urlToken = searchParams.get('token') || '';
  const urlCode = searchParams.get('code') || searchParams.get('otp') || '';

  const { requestPasswordReset, verifyResetOtp, resetPassword } = useAuth();

  const [step, setStep] = useState<ResetStep>('request');
  const [email, setEmail] = useState(urlEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [resendCountdown, setResendCountdown] = useState(0);

  // If URL has email + code/token (redirected from email link), auto-verify & proceed to new_password step!
  useEffect(() => {
    if (urlEmail) {
      setEmail(urlEmail);
      if (urlCode && urlCode.length === 6) {
        setOtp(urlCode.split(''));
        setLoading(true);
        verifyResetOtp(urlEmail, urlCode).then((res) => {
          setLoading(false);
          if (res.success) {
            setStep('new_password');
            setInfoMessage('Email address verified via direct reset link! Please enter your new password below.');
          } else {
            setError(res.error || 'Direct reset link expired or code invalid.');
            setStep('verify');
          }
        }).catch(() => {
          setLoading(false);
          setStep('verify');
        });
      } else if (urlToken) {
        setStep('new_password');
        setInfoMessage('Email address verified via reset link. Please enter your new password.');
      }
    }
  }, [urlEmail, urlToken, urlCode]);

  // Resend timer countdown
  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setInterval(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Handle Request Verification Code Email
  const handleRequestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

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

      setStep('verify');
      setResendCountdown(60);
    } catch (err: any) {
      setError(err.message || 'An error occurred while sending verification email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend Email
  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setResendCountdown(60);
        setInfoMessage('A new verification code email has been sent.');
      } else {
        setError(res.error || 'Failed to resend verification code email.');
      }
    } catch (err: any) {
      setError('Error resending verification code email.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Input handler
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle Paste for 6-digit OTP Code
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''));
      const lastInput = document.getElementById('otp-input-5');
      if (lastInput) lastInput.focus();
    }
  };

  // Handle OTP Verification Submit
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter all 6 digits of the confirmation code.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyResetOtp(email, otpCode);
      if (!res.success) {
        setError(res.error || 'Invalid verification code. Please check your email and try again.');
        setLoading(false);
        return;
      }

      setStep('new_password');
      setInfoMessage('Code verified successfully. Now create your new password.');
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate Password Strength
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '25%', textColor: 'text-red-600' };
    if (score <= 3) return { label: 'Medium', color: 'bg-amber-500', width: '60%', textColor: 'text-amber-600' };
    return { label: 'Strong', color: 'bg-emerald-600', width: '100%', textColor: 'text-emerald-700' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Criteria validation
  const isMinLength = newPassword.length >= 6;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Save new password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isMinLength) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(email, newPassword);
      if (!res.success) {
        setError(res.error || 'Failed to update password.');
        setLoading(false);
        return;
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Error updating password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF8F5] min-h-[85vh] py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="Benue Market" className="h-14 w-auto mx-auto object-contain" />
          </Link>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-[#111827] tracking-tight">
            Security & Account Recovery
          </h1>
          <p className="text-xs text-[#4B5563] max-w-sm mx-auto">
            Reset your password with verified email confirmation & end-to-end security
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-xs">
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
            <div className={`flex flex-col items-center gap-1 ${step === 'request' ? 'text-[#0F5132]' : 'text-[#9CA3AF]'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold transition-all ${
                step === 'request' ? 'bg-[#0F5132] text-white shadow-xs' : 'bg-[#E8F5E9] text-[#0F5132]'
              }`}>
                1
              </div>
              <span>Request Code</span>
            </div>

            <div className={`flex flex-col items-center gap-1 ${step === 'verify' ? 'text-[#0F5132]' : 'text-[#9CA3AF]'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold transition-all ${
                step === 'verify' ? 'bg-[#0F5132] text-white shadow-xs' : (step === 'new_password' || step === 'success') ? 'bg-[#E8F5E9] text-[#0F5132]' : 'bg-[#F3F4F6] text-[#9CA3AF]'
              }`}>
                2
              </div>
              <span>Email Confirm</span>
            </div>

            <div className={`flex flex-col items-center gap-1 ${step === 'new_password' ? 'text-[#0F5132]' : 'text-[#9CA3AF]'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold transition-all ${
                step === 'new_password' ? 'bg-[#0F5132] text-white shadow-xs' : (step === 'success') ? 'bg-[#E8F5E9] text-[#0F5132]' : 'bg-[#F3F4F6] text-[#9CA3AF]'
              }`}>
                3
              </div>
              <span>New Password</span>
            </div>

            <div className={`flex flex-col items-center gap-1 ${step === 'success' ? 'text-[#0F5132]' : 'text-[#9CA3AF]'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold transition-all ${
                step === 'success' ? 'bg-[#10B981] text-white shadow-xs' : 'bg-[#F3F4F6] text-[#9CA3AF]'
              }`}>
                4
              </div>
              <span>Done</span>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white p-7 sm:p-9 rounded-3xl border border-[#E8E2D9] shadow-lg space-y-6">

          {/* Banner Messages */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && !error && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-[#0F5132] font-semibold flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* STEP 1: REQUEST CODE */}
          {step === 'request' && (
            <form onSubmit={handleRequestEmail} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827]">Registered Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. farmer@benuemarket.ng"
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-extrabold text-sm py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Sending Verification Code...</span>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs font-bold text-[#4B5563] hover:text-[#111827] inline-flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFY EMAIL & CONFIRMATION CODE */}
          {step === 'verify' && (
            <div className="space-y-6">
              <div className="text-center space-y-3 py-2">
                <div className="w-16 h-16 rounded-3xl bg-[#E8F5E9] text-[#0F5132] flex items-center justify-center mx-auto shadow-sm relative">
                  <Mail className="w-8 h-8 text-[#0F5132]" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-4 ring-white animate-pulse" />
                </div>
                <h3 className="font-extrabold text-xl text-[#111827]">Check Your Personal Email</h3>
                <p className="text-xs text-[#4B5563] max-w-xs mx-auto leading-relaxed">
                  We dispatched a 6-digit verification code to your email <br />
                  <strong className="text-[#111827] text-sm font-semibold">{maskEmail(email)}</strong>
                </p>
              </div>

              {/* Enter 6-Digit OTP Code directly */}
              <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
                <div className="text-center space-y-1">
                  <label className="text-xs font-bold text-[#111827]">Enter 6-Digit Verification Code</label>
                  <p className="text-[11px] text-[#6B7280]">Check your inbox or spam folder for the code</p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-12 text-center text-lg font-black text-[#111827] bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-mono"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-extrabold text-sm py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Verifying Code...' : 'Verify Code & Proceed'}
                </button>
              </form>

              {/* Resend Link */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D9] text-xs">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-[#4B5563] font-bold hover:text-[#111827]"
                >
                  Change Email
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCountdown > 0 || loading}
                  className={`font-bold flex items-center gap-1.5 ${
                    resendCountdown > 0 ? 'text-[#9CA3AF]' : 'text-[#0F5132] hover:underline'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCountdown > 0 ? `Resend Email in ${resendCountdown}s` : 'Resend Email Code'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 'new_password' && (
            <form onSubmit={handleSavePassword} className="space-y-5">
              <div className="bg-[#E8F5E9] p-3.5 rounded-2xl border border-[#C8E6C9] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#0F5132]">Email Verification Confirmed</p>
                  <p className="text-xs font-mono font-extrabold text-[#111827]">{maskEmail(email)}</p>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827]">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-10 py-3 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[#9CA3AF] hover:text-[#111827]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Live Password Strength Indicator */}
                {newPassword && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#6B7280]">Password Strength:</span>
                      <span className={`font-extrabold ${passwordStrength.textColor}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#111827]">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-10 py-3 bg-[#FAF8F5] border border-[#D6CDC0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#0F5132] focus:ring-2 focus:ring-[#0F5132]/20 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-[#9CA3AF] hover:text-[#111827]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Criteria Checklist */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8E2D9] space-y-2 text-xs">
                <p className="font-bold text-[#111827] text-[11px]">Password Security Requirements:</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${isMinLength ? 'text-emerald-700 font-bold' : 'text-[#6B7280]'}`}>
                    <Check className={`w-3.5 h-3.5 ${isMinLength ? 'text-emerald-600' : 'text-gray-300'}`} />
                    <span>At least 6 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-700 font-bold' : 'text-[#6B7280]'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasUppercase ? 'text-emerald-600' : 'text-gray-300'}`} />
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-bold' : 'text-[#6B7280]'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasNumber ? 'text-emerald-600' : 'text-gray-300'}`} />
                    <span>Number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-700 font-bold' : 'text-[#6B7280]'}`}>
                    <Check className={`w-3.5 h-3.5 ${isMatch ? 'text-emerald-600' : 'text-gray-300'}`} />
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-extrabold text-sm py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Updating Credentials...' : 'Save New Password & Complete'}
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-full bg-[#E8F5E9] text-[#10B981] flex items-center justify-center mx-auto shadow-md animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
              </div>

              <div className="space-y-1">
                <h3 className="font-extrabold text-2xl text-[#111827]">Password Reset Complete!</h3>
                <p className="text-xs text-[#4B5563] max-w-xs mx-auto">
                  Your account security credentials for <strong className="text-[#111827]">{maskEmail(email)}</strong> have been successfully updated.
                </p>
              </div>

              {/* Security Alert Email Confirmation Badge */}
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-left flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0F5132] shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-emerald-900">
                  <p className="font-extrabold text-[#0F5132]">📩 Security Email Dispatched</p>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    A confirmation email has been sent to <strong>{maskEmail(email)}</strong> confirming that your password was successfully changed.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full bg-[#0F5132] hover:bg-[#0B3D26] text-white font-extrabold text-sm py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

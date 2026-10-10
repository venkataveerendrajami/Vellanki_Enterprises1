import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Leaf, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const { forgotPasswordSendOtp, forgotPasswordReset } = useAuth();
  const navigate = useNavigate();

  // Step 1: Enter Email, Step 2: Enter OTP & New Password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [simulationInfo, setSimulationInfo] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const inputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Step 1: Send Reset OTP to Email via Brevo
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPasswordSendOtp(cleanEmail);
      setStep(2);
      setCountdown(30);
      setSuccessMsg(res.message || `Password reset code sent to ${cleanEmail}`);

      if (res.simulated && res.previewOtp) {
        setSimulationInfo({
          previewOtp: res.previewOtp,
          maskedTarget: res.maskedTarget || cleanEmail
        });
      }
    } catch (err) {
      setError(err.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // OTP digit handling
  const handleDigitChange = (index, value) => {
    if (value.length > 1) {
      const pastedDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = [...otpCode];
      pastedDigits.forEach((d, i) => {
        if (i < 6) newCode[i] = d;
      });
      setOtpCode(newCode);
      const nextIndex = Math.min(pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newCode = [...otpCode];
    newCode[index] = digit;
    setOtpCode(newCode);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const codeStr = otpCode.join('');

    if (codeStr.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPasswordReset(email.trim().toLowerCase(), codeStr, newPassword);
      setSuccessMsg(res.message || 'Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successfully. Please sign in with your new password.' } });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Could not reset password. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-sand-light/50 to-white">
      <div className="max-w-md w-full space-y-6 bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-11 h-11 rounded-2xl bg-forest flex items-center justify-center text-white shadow-md shadow-forest/20 group-hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6 text-emerald-300" />
            </div>
            <div className="text-left">
              <span className="font-heading font-black text-lg tracking-tight text-forest block leading-none">
                VELLANKI
              </span>
              <span className="text-[10px] tracking-widest text-earth font-bold block uppercase">
                ENTERPRISES
              </span>
            </div>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-bold mt-2">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Reset Password</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-gray-900 tracking-tight">
            Forgot Your Password?
          </h2>
          <p className="text-xs text-gray-500">
            {step === 1 
              ? 'Enter your registered email address and we will send a 6-digit recovery code via Brevo'
              : 'Enter the 6-digit code received in your email and choose a new password'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Development Simulation Info */}
        {simulationInfo && step === 2 && (
          <div className="p-3.5 bg-emerald-950 text-white rounded-2xl shadow-lg space-y-2 text-xs border border-emerald-800">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-emerald-300 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                📧 Simulated Brevo Reset Code
              </span>
              <button
                type="button"
                onClick={() => setOtpCode(simulationInfo.previewOtp.split(''))}
                className="text-[10px] bg-emerald-700 hover:bg-emerald-600 px-2 py-0.5 rounded-lg font-bold text-white transition-all shadow"
              >
                Auto-Fill Code
              </button>
            </div>
            <div className="flex items-center justify-between bg-black/30 p-2 rounded-xl">
              <span className="text-[11px] text-emerald-200">OTP Code:</span>
              <span className="font-mono text-xl font-black tracking-widest text-emerald-300">
                {simulationInfo.previewOtp}
              </span>
            </div>
            <p className="text-[10px] text-emerald-300/80 italic">
              Note: Add <code className="bg-black/40 px-1 py-0.5 rounded text-white">BREVO_API_KEY</code> in <code className="bg-black/40 px-1 py-0.5 rounded text-white">.env</code> to deliver live emails directly to inboxes.
            </p>
          </div>
        )}

        {/* STEP 1: ENTER REGISTERED EMAIL */}
        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-forest focus:ring-2 focus:ring-forest/20 outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Verification code dispatched via Brevo Transactional Email.</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-forest hover:bg-forest-light text-white font-bold text-sm rounded-2xl shadow-lg shadow-forest/20 hover:shadow-xl hover:shadow-forest/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Sending Code via Brevo...</span>
                </span>
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: ENTER OTP & NEW PASSWORD */
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-center space-y-1 pb-1">
              <p className="text-xs text-gray-500">
                Enter the 6-digit verification code sent to:
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-bold text-xs text-forest bg-forest/10 px-2.5 py-0.5 rounded-full">
                  {email}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtpCode(['', '', '', '', '', '']);
                    setError('');
                    setSimulationInfo(null);
                  }}
                  className="text-[11px] text-gray-400 hover:text-forest underline"
                >
                  Change
                </button>
              </div>
            </div>

            {/* 6-Digit OTP Boxes */}
            <div className="flex justify-between gap-1.5 sm:gap-2">
              {otpCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-13 sm:w-13 sm:h-14 text-center font-mono text-xl font-bold bg-gray-50 border-2 border-gray-200 rounded-2xl focus:bg-white focus:border-forest focus:ring-2 focus:ring-forest/20 outline-none transition-all shadow-inner"
                />
              ))}
            </div>

            {/* Resend Cooldown */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Expires in 5 mins</span>
              </div>

              {countdown > 0 ? (
                <span className="text-gray-400 font-medium text-[11px]">
                  Resend in {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={loading}
                  className="font-bold text-forest hover:text-forest-light text-[11px] flex items-center gap-1 hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Resend Code</span>
                </button>
              )}
            </div>

            {/* New Password Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-forest focus:ring-2 focus:ring-forest/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-forest focus:ring-2 focus:ring-forest/20 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-forest hover:bg-forest-light text-white font-bold text-sm rounded-2xl shadow-lg shadow-forest/20 hover:shadow-xl hover:shadow-forest/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Updating Password...</span>
                </span>
              ) : (
                <span>Reset Password & Continue</span>
              )}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div className="pt-2 text-center">
          <Link
            to="/login"
            className="text-xs text-gray-500 hover:text-forest font-bold inline-flex items-center gap-1 hover:underline"
          >
            <span>← Back to Sign In</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;

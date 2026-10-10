import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, sendOtp, loginWithOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'otp' | 'password'
  const [authMode, setAuthMode] = useState('otp');

  // Email OTP state
  const [otpStep, setOtpStep] = useState(1); // 1 = Enter Email, 2 = Enter 6-digit OTP
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [simulationInfo, setSimulationInfo] = useState(null);

  // Password mode state
  const [passwordEmail, setPasswordEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Common UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const inputRefs = useRef([]);
  const redirectPath = location.state?.from || '/';

  // Timer countdown
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle Requesting Email OTP via Brevo
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await sendOtp(cleanEmail, 'email', 'login');
      setOtpStep(2);
      setCountdown(30);
      setSuccessMsg(res.message || `Verification code sent to ${cleanEmail}`);

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

  // Handle OTP digit changes
  const handleDigitChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste of multiple characters
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

  // Handle OTP Verification & Sign In
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const codeStr = otpCode.join('');
    if (codeStr.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      await loginWithOtp(email.trim().toLowerCase(), codeStr);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Login
  const handlePasswordLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const cleanId = (passwordEmail || email).trim().toLowerCase();

    if (!cleanId || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(cleanId, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
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
          <h2 className="text-2xl font-bold font-heading text-gray-900 tracking-tight pt-2">
            Welcome Back
          </h2>
          <p className="text-xs text-gray-500">
            Sign in to manage your eco-friendly orders & saved products
          </p>
        </div>

        {/* Authentication Mode Switcher */}
        <div className="p-1 bg-gray-100 rounded-2xl flex text-xs font-bold text-gray-600">
          <button
            type="button"
            onClick={() => {
              setAuthMode('otp');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'otp'
                ? 'bg-white text-forest shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-forest" />
            <span>Email OTP Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'password'
                ? 'bg-white text-forest shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password</span>
          </button>
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

        {/* Development Simulation Info (When real Brevo API key is not configured) */}
        {simulationInfo && otpStep === 2 && (
          <div className="p-3.5 bg-emerald-950 text-white rounded-2xl shadow-lg space-y-2 text-xs border border-emerald-800">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-emerald-300 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                📧 Simulated Brevo Email OTP
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

        {/* MODE 1: EMAIL OTP (POWERED BY BREVO) */}
        {authMode === 'otp' && (
          <div className="space-y-4">
            {otpStep === 1 ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Your Email Address
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
                    <span>A secure 6-digit code will be sent to your email via Brevo.</span>
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
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
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
                        setOtpStep(1);
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-forest hover:bg-forest-light text-white font-bold text-sm rounded-2xl shadow-lg shadow-forest/20 hover:shadow-xl hover:shadow-forest/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Verifying Code...</span>
                    </span>
                  ) : (
                    <span>Verify & Sign In</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* MODE 2: EMAIL + PASSWORD LOGIN */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={passwordEmail || email}
                  onChange={(e) => {
                    setPasswordEmail(e.target.value);
                    setEmail(e.target.value);
                  }}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-forest focus:ring-2 focus:ring-forest/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-forest hover:text-forest-light font-bold hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-forest focus:ring-forest"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-forest hover:bg-forest-light text-white font-bold text-sm rounded-2xl shadow-lg shadow-forest/20 hover:shadow-xl hover:shadow-forest/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Signing In...</span>
                </span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Links & Registration Navigation */}
        <div className="pt-2 text-center space-y-3">
          <p className="text-xs text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-forest hover:text-forest-light font-bold hover:underline">
              Create an account
            </Link>
          </p>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-center gap-3 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            <span className="flex items-center gap-1">
              <Leaf className="w-3 h-3 text-emerald-600" />
              100% Eco-Friendly
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-forest" />
              Brevo Verified
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;

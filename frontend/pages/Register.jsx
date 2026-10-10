import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Leaf, 
  Lock, 
  Mail, 
  User, 
  Phone, 
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

const Register = () => {
  const { register, sendOtp, loginWithOtp } = useAuth();
  const navigate = useNavigate();

  // Mode: 'otp' | 'password'
  const [regMode, setRegMode] = useState('otp');

  // Email OTP state
  const [otpStep, setOtpStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [simulationInfo, setSimulationInfo] = useState(null);

  // Password registration state
  const [passwordFormData, setPasswordFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Common UI state
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

  // Request Email OTP for Registration
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await sendOtp(cleanEmail, 'email', 'register');
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

  // Verify OTP and complete registration
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
      await loginWithOtp(email.trim().toLowerCase(), codeStr, name.trim(), 'register');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Traditional Password Registration
  const handlePasswordRegister = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const { name: regName, email: regEmail, phone: regPhone, password, confirmPassword } = passwordFormData;

    if (!regName.trim() || !regEmail.trim() || !password) {
      setError('Name, email, and password are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone ? regPhone.trim() : null,
        password
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
            Create Your Account
          </h2>
          <p className="text-xs text-gray-500">
            Join VELLANKI ENTERPRISES for sustainable eco-friendly tableware
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="p-1 bg-gray-100 rounded-2xl flex text-xs font-bold text-gray-600">
          <button
            type="button"
            onClick={() => {
              setRegMode('otp');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              regMode === 'otp'
                ? 'bg-white text-forest shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-forest" />
            <span>Email OTP Sign Up</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRegMode('password');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              regMode === 'password'
                ? 'bg-white text-forest shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>With Password</span>
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

        {/* Development Simulation Info */}
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

        {/* MODE 1: EMAIL OTP REGISTRATION */}
        {regMode === 'otp' && (
          <div className="space-y-4">
            {otpStep === 1 ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-forest focus:ring-2 focus:ring-forest/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Email Address
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
                    <span>Your 6-digit verification code will be sent to this email via Brevo.</span>
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
                      <span>Creating Account...</span>
                    </span>
                  ) : (
                    <span>Verify & Create Account</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* MODE 2: WITH PASSWORD REGISTRATION */}
        {regMode === 'password' && (
          <form onSubmit={handlePasswordRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={passwordFormData.name}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-forest focus:ring-2 focus:ring-forest/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={passwordFormData.email}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-forest focus:ring-2 focus:ring-forest/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Mobile Number <span className="text-gray-400 font-normal">(Optional for delivery)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={passwordFormData.phone}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-forest focus:ring-2 focus:ring-forest/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordFormData.password}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, password: e.target.value })}
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

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-forest focus:ring-2 focus:ring-forest/20 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-forest hover:bg-forest-light text-white font-bold text-sm rounded-2xl shadow-lg shadow-forest/20 hover:shadow-xl hover:shadow-forest/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Creating Account...</span>
                </span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="pt-2 text-center space-y-3">
          <p className="text-xs text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-forest hover:text-forest-light font-bold hover:underline">
              Sign in
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

export default Register;

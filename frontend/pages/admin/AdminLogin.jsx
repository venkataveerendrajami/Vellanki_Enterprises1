import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Leaf } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      await adminLogin(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Administrator authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 sm:p-10 shadow-2xl max-w-md w-full space-y-6 text-white">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Administrator Portal
          </h2>
          <p className="text-xs text-slate-400">
            VELLANKI ENTERPRISES — Store Management System
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="admin@vellanki.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-900/80 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-white placeholder:text-slate-500"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-900/80 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-white placeholder:text-slate-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-700/60">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors">
            ← Return to Customer Storefront
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;

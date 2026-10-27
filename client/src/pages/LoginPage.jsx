import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}!`, 'success');
      navigate(user.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoUser = () => {
    setEmail('user@imovies.com');
    setPassword('User@password123');
  };

  const fillDemoAdmin = () => {
    setEmail('admin@imovies.com');
    setPassword('Admin@password123');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6D28D9] via-[#8B5CF6] to-[#A78BFA] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/30 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black text-white">IMovies</span>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to your account</h2>
          <p className="text-xs text-slate-400">Book tickets, manage reservations, and track your watchlists</p>
        </div>

        {/* Demo Credentials Quick-Fill Cards */}
        <div className="p-3.5 rounded-xl bg-[#171126] border border-[#302343] space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">
            Technical Mentor Demo Access:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillDemoUser}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-left transition flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-[#8B5CF6] shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold text-white">Demo Customer</p>
                <p className="text-[10px] text-slate-400 truncate">user@imovies.com</p>
              </div>
            </button>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-amber-950/40 border border-amber-600/40 text-left transition flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold text-amber-300">Admin Portal</p>
                <p className="text-[10px] text-slate-400 truncate">admin@imovies.com</p>
              </div>
            </button>
          </div>
        </div>

        {/* Main Form */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#171126] border border-[#302343] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-[#302343] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-[#302343] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl font-bold text-xs text-white bg-[#8B5CF6] hover:bg-[#A78BFA] shadow-xl shadow-[#8B5CF6]/30 transition transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an IMovies account?{' '}
            <Link to="/register" className="text-[#A78BFA] hover:text-[#C4B5FD] font-semibold underline">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

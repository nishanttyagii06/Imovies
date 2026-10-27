import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, User, Mail, Lock, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      showToast('Please fill all required fields.', 'warning');
      return;
    }

    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'warning');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: formData.name,
        username: formData.username || formData.email.split('@')[0],
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      showToast('Account created successfully! Welcome to IMovies.', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const passwordValid = formData.password.length >= 6;
  const passwordsMatch = formData.password && formData.password === formData.confirmPassword;

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black text-white">IMovies</span>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create your IMovies account</h2>
          <p className="text-xs text-slate-400">Join cinema enthusiasts and experience seamless instant bookings</p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-cinema-card border border-cinema-border shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Johnson"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="alexj"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 00000"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@domain.com"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${passwordValid ? 'text-emerald-400' : 'text-slate-600'}`}
                />
                <span className={passwordValid ? 'text-emerald-400' : 'text-slate-500'}>
                  Minimum 6 characters
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
              {formData.confirmPassword && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}
                  />
                  <span className={passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordValid || !passwordsMatch}
              className="w-full mt-3 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 shadow-xl shadow-brand-900/40 transition transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

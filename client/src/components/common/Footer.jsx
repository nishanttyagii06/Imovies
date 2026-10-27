import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, ShieldCheck, CreditCard, Sparkles, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-cinema-darkest border-t border-cinema-border/70 mt-20 pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-cinema-border/50">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-600/30">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">IMovies</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Next-generation cinema ticketing platform. Discover latest releases, explore screen showtimes, and book your preferred seats with real-time seat lock protection.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full-Stack MERN Architecture</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/movies?status=now_showing" className="hover:text-brand-400 transition">
                  Now Showing
                </Link>
              </li>
              <li>
                <Link to="/movies?status=coming_soon" className="hover:text-brand-400 transition">
                  Coming Soon
                </Link>
              </li>
              <li>
                <Link to="/movies?genre=Action" className="hover:text-brand-400 transition">
                  Action Blockbusters
                </Link>
              </li>
              <li>
                <Link to="/movies?genre=Sci-Fi" className="hover:text-brand-400 transition">
                  Sci-Fi Cinema
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Verification */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Safe & Verified
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Encrypted JWT Sessions</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <CreditCard className="w-4 h-4 text-brand-400 shrink-0" />
                <span>Test Gateway & Razorpay</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Film className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Digital QR Code E-Tickets</span>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Support Desk
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-brand-400" />
                <span>support@imovies.com</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-brand-400" />
                <span>+91 1800 200 4567 (Toll Free)</span>
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                Demo Admin: admin@imovies.com / Admin@password123
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} IMovies Entertainment Inc. Built for technical mentor evaluation.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-brand-500 fill-brand-500" />
            <span>using React, Express & MongoDB</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Film, Ticket, Bookmark, User, LogOut, ShieldAlert, Menu, X, ChevronDown, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Navbar = ({ selectedCity = 'Mumbai', onSelectCity }) => {
  const { user, isAdmin, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    showToast('Signed out successfully.', 'info');
    navigate('/');
    setDropdownOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition duration-200 pb-0.5 ${
      isActive ? 'text-[#8B5CF6] font-bold border-b-2 border-[#8B5CF6]' : 'text-slate-300 hover:text-[#A78BFA]'
    }`;

  const cities = ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad'];

  return (
    <header className="sticky top-0 z-40 bg-cinema-darkest/95 backdrop-blur-md border-b border-cinema-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Logo & City Selector */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6D28D9] via-[#8B5CF6] to-[#A78BFA] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/30 group-hover:scale-105 transition-transform duration-200">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white group-hover:text-[#A78BFA] transition">
                  IMovies
                </span>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-slate-400 -mt-1">
                  Cinemas
                </span>
              </div>
            </Link>

            {/* City selector */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cinema-card border border-[#302343] text-xs text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <select
                value={selectedCity}
                onChange={(e) => onSelectCity && onSelectCity(e.target.value)}
                className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                {cities.map((city) => (
                  <option key={city} value={city} className="bg-cinema-darkest text-slate-100">
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/movies" className={navLinkClass}>
              Movies
            </NavLink>
            {user && (
              <>
                <NavLink to="/my-bookings" className={navLinkClass}>
                  My Bookings
                </NavLink>
                <NavLink to="/watchlist" className={navLinkClass}>
                  Watchlist
                </NavLink>
              </>
            )}
            {isAdmin && (
              <NavLink
                to="/admin"
                className="flex items-center gap-1 text-sm font-semibold text-amber-400 hover:text-amber-300 transition"
              >
                <ShieldAlert className="w-4 h-4" />
                Admin Panel
              </NavLink>
            )}
          </nav>

          {/* User actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-cinema-card hover:bg-slate-800/80 border border-cinema-border transition focus:outline-none"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/20 text-[#C4B5FD] flex items-center justify-center font-bold text-xs uppercase border border-[#8B5CF6]/30">
                    {user.name ? user.name[0] : 'U'}
                  </div>
                  <div className="text-left text-xs">
                    <div className="text-slate-200 font-medium truncate max-w-[100px]">
                      {user.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-[#A78BFA] font-semibold uppercase">
                      {user.role}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl bg-cinema-card border border-cinema-border shadow-2xl py-1 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-cinema-border/60">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-100 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Account Profile
                    </Link>

                    <Link
                      to="/my-bookings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                    >
                      <Ticket className="w-4 h-4 text-slate-400" />
                      Booking History
                    </Link>

                    <Link
                      to="/watchlist"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                    >
                      <Bookmark className="w-4 h-4 text-slate-400" />
                      Saved Movies
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-amber-400 hover:bg-amber-500/10 transition border-t border-cinema-border/60"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}

                    <div className="border-t border-cinema-border/60 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-cinema-card transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#8B5CF6] hover:bg-[#A78BFA] shadow-md shadow-[#8B5CF6]/30 transition transform hover:-translate-y-0.5 active:scale-95"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-cinema-card text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-cinema-border space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Home
            </Link>
            <Link
              to="/movies"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Browse Movies
            </Link>
            {user ? (
              <>
                <Link
                  to="/my-bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  My Bookings
                </Link>
                <Link
                  to="/watchlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  Watchlist
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/10"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-lg bg-cinema-card text-sm text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-lg bg-brand-600 text-sm text-white font-medium"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Film, Clapperboard, Calendar, Users, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
  const { user } = useAuth();

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
      isActive
        ? 'bg-brand-600 text-white shadow-md shadow-brand-900/30'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Admin Sidebar Navigation */}
        <aside className="w-full md:w-64 space-y-6 shrink-0">
          <div className="p-4 rounded-2xl bg-cinema-card border border-cinema-border space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-xs uppercase tracking-wider pb-3 border-b border-cinema-border/60">
              <ShieldCheck className="w-4 h-4" />
              <span>Administration</span>
            </div>

            <nav className="space-y-1">
              <NavLink to="/admin" end className={navClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink to="/admin/movies" className={navClass}>
                <Film className="w-4 h-4" />
                <span>Movie Management</span>
              </NavLink>

              <NavLink to="/admin/theatres" className={navClass}>
                <Clapperboard className="w-4 h-4" />
                <span>Theatres & Screens</span>
              </NavLink>

              <NavLink to="/admin/shows" className={navClass}>
                <Calendar className="w-4 h-4" />
                <span>Show Schedules</span>
              </NavLink>

              <NavLink to="/admin/bookings" className={navClass}>
                <Users className="w-4 h-4" />
                <span>Bookings & Users</span>
              </NavLink>
            </nav>

            <div className="pt-3 border-t border-cinema-border/60">
              <Link
                to="/"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Cinema</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Admin Main Outlet */}
        <main className="flex-1 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

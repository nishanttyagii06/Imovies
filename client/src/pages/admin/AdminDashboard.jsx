import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film, Clapperboard, Calendar, Ticket, IndianRupee, Users, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load admin metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Platform Overview</h1>
        <p className="text-xs text-slate-400 mt-1">Real-time cinema platform metrics and analytics</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Revenue Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cinema-card to-emerald-950/20 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Verified Revenue</span>
            <IndianRupee className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            ₹{stats?.totalRevenue?.toLocaleString('en-IN') || 0}
          </p>
          <p className="text-[10px] text-emerald-400/80">From successful payments</p>
        </div>

        {/* Confirmed Bookings Card */}
        <div className="p-5 rounded-2xl bg-cinema-card border border-cinema-border space-y-3">
          <div className="flex items-center justify-between text-brand-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Confirmed Bookings
            </span>
            <Ticket className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats?.confirmedBookings || 0}</p>
          <p className="text-[10px] text-slate-500">Out of {stats?.totalBookings || 0} initiated</p>
        </div>

        {/* Movies Card */}
        <div className="p-5 rounded-2xl bg-cinema-card border border-cinema-border space-y-3">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Movies
            </span>
            <Film className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats?.totalMovies || 0}</p>
          <p className="text-[10px] text-slate-500">In catalog</p>
        </div>

        {/* Theatres Card */}
        <div className="p-5 rounded-2xl bg-cinema-card border border-cinema-border space-y-3">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Partner Theatres
            </span>
            <Clapperboard className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats?.totalTheatres || 0}</p>
          <p className="text-[10px] text-slate-500">Active cinema complexes</p>
        </div>

        {/* Upcoming Shows */}
        <div className="p-5 rounded-2xl bg-cinema-card border border-cinema-border space-y-3">
          <div className="flex items-center justify-between text-gold-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Upcoming Shows
            </span>
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats?.upcomingShows || 0}</p>
          <p className="text-[10px] text-slate-500">Scheduled on screens</p>
        </div>

        {/* Registered Users */}
        <div className="p-5 rounded-2xl bg-cinema-card border border-cinema-border space-y-3">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Registered Customers
            </span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats?.totalUsers || 0}</p>
          <p className="text-[10px] text-slate-500">Active user profiles</p>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="p-6 rounded-2xl bg-cinema-card border border-cinema-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cinema-border/60">
          <h2 className="text-base font-bold text-white">Recent Transactions & Bookings</h2>
          <Link
            to="/admin/bookings"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recentBookings?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60">
                <tr>
                  <th className="py-2.5 px-3">Booking ID</th>
                  <th className="py-2.5 px-3">Movie</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stats.recentBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-slate-300">{b.bookingId}</td>
                    <td className="py-3 px-3 font-semibold text-white">{b.movieDetails?.title}</td>
                    <td className="py-3 px-3 text-slate-300">{b.user?.name || 'Customer'}</td>
                    <td className="py-3 px-3 font-black text-white">₹{b.totalAmount}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.bookingStatus === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : b.bookingStatus === 'cancelled'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">No recent bookings recorded.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

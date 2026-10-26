import React, { useState, useEffect } from 'react';
import { Users, Ticket, Search, ShieldCheck, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminBookingsUsers = () => {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'users'
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/admin/all', {
        params: { status: bookingFilter, search },
      });
      if (res.data.success) {
        setBookings(res.data.data.bookings || []);
      }
    } catch (err) {
      console.error('Error fetching admin bookings:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users', { params: { search } });
      if (res.data.success) {
        setUsers(res.data.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'bookings') {
      fetchBookings().finally(() => setLoading(false));
    } else {
      fetchUsers().finally(() => setLoading(false));
    }
  }, [activeTab, bookingFilter, search]);

  const handleToggleUserStatus = async (userId, currentStatus, userName) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/toggle-status`);
      if (res.data.success) {
        showToast(res.data.message, 'success');
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to toggle status.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Bookings & Customer Directory</h1>
          <p className="text-xs text-slate-400 mt-1">Audit platform transactions and manage member accounts</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-cinema-card p-1 border border-cinema-border self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'bookings'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>All Bookings</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Accounts</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl bg-cinema-card border border-cinema-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'bookings' ? 'Search by ID or customer...' : 'Search by name or email...'}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        {activeTab === 'bookings' && (
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <span className="text-slate-400 font-semibold">Filter:</span>
            <select
              value={bookingFilter}
              onChange={(e) => setBookingFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-cinema-border text-white text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Bookings</option>
              <option value="confirmed">Confirmed Only</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        )}
      </div>

      {/* Bookings Table */}
      {activeTab === 'bookings' && (
        <div className="rounded-2xl bg-cinema-card border border-cinema-border overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/80 border-b border-cinema-border">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Movie</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-300">{b.bookingId}</td>
                    <td className="py-3 px-4 font-bold text-white">{b.movieDetails?.title}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <p className="font-semibold text-white">{b.user?.name || 'Customer'}</p>
                      <p className="text-[10px] text-slate-400">{b.user?.email}</p>
                    </td>
                    <td className="py-3 px-4 font-bold text-brand-400">
                      {b.seats?.map((s) => s.seatNumber).join(', ')}
                    </td>
                    <td className="py-3 px-4 font-black text-white">₹{b.totalAmount}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          b.bookingStatus === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : b.bookingStatus === 'cancelled'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Table */}
      {activeTab === 'users' && (
        <div className="rounded-2xl bg-cinema-card border border-cinema-border overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/80 border-b border-cinema-border">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 flex items-center gap-2.5 font-bold text-white">
                      <div className="w-7 h-7 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center font-bold text-xs uppercase border border-brand-500/30">
                        {u.name ? u.name[0] : 'U'}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.isActive
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u._id, u.isActive, u.name)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                            u.isActive
                              ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40'
                              : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/40'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsUsers;

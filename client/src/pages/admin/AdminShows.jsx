import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Clock, MapPin, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminShows = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    movieId: '',
    theatreId: '',
    screenName: '',
    showDate: new Date().toISOString().split('T')[0],
    showTime: '06:30 PM',
    vipPrice: 450,
    premiumPrice: 300,
    standardPrice: 200,
  });

  const fetchData = async () => {
    try {
      const [showsRes, moviesRes, theatresRes] = await Promise.all([
        api.get('/shows'),
        api.get('/movies', { params: { limit: 100 } }),
        api.get('/theatres'),
      ]);

      if (showsRes.data.success) setShows(showsRes.data.data || []);
      if (moviesRes.data.success) setMovies(moviesRes.data.data.movies || []);
      if (theatresRes.data.success) setTheatres(theatresRes.data.data || []);
    } catch (err) {
      console.error('Error fetching shows admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openScheduleModal = () => {
    setFormData({
      movieId: movies[0]?._id || '',
      theatreId: theatres[0]?._id || '',
      screenName: theatres[0]?.screens[0]?.screenName || 'Screen 1',
      showDate: new Date().toISOString().split('T')[0],
      showTime: '06:30 PM',
      vipPrice: 450,
      premiumPrice: 300,
      standardPrice: 200,
    });
    setShowModal(true);
  };

  const handleTheatreChange = (e) => {
    const tId = e.target.value;
    const selectedTheatre = theatres.find((t) => t._id === tId);
    setFormData({
      ...formData,
      theatreId: tId,
      screenName: selectedTheatre?.screens[0]?.screenName || 'Screen 1',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        movieId: formData.movieId,
        theatreId: formData.theatreId,
        screenName: formData.screenName,
        showDate: formData.showDate,
        showTime: formData.showTime,
        pricing: {
          vip: Number(formData.vipPrice),
          premium: Number(formData.premiumPrice),
          standard: Number(formData.standardPrice),
        },
      };

      const res = await api.post('/shows', payload);
      if (res.data.success) {
        showToast('Show scheduled successfully!', 'success');
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to schedule show.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShow = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scheduled show?')) return;

    try {
      const res = await api.delete(`/shows/${id}`);
      if (res.data.success) {
        showToast('Show deleted.', 'info');
        setShows(shows.filter((s) => s._id !== id));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Cannot delete show with booked seats.', 'error');
    }
  };

  const selectedTheatreObj = theatres.find((t) => t._id === formData.theatreId) || theatres[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Show Scheduling</h1>
          <p className="text-xs text-slate-400 mt-1">
            Schedule movie slots across auditoriums with automatic seat generation & conflict prevention
          </p>
        </div>

        <button
          onClick={openScheduleModal}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Show</span>
        </button>
      </div>

      {/* Shows Table */}
      <div className="rounded-2xl bg-cinema-card border border-cinema-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/80 border-b border-cinema-border">
              <tr>
                <th className="py-3 px-4">Movie</th>
                <th className="py-3 px-4">Cinema & Screen</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Seats Reserved</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {shows.map((s) => {
                const bookedSeats = s.seats?.filter((seat) => seat.status === 'booked').length || 0;
                const totalSeats = s.seats?.length || 60;

                return (
                  <tr key={s._id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={s.movie?.posterUrl}
                        alt={s.movie?.title}
                        className="w-9 h-12 object-cover rounded-md border border-cinema-border shrink-0"
                      />
                      <div>
                        <p className="font-bold text-white">{s.movie?.title || 'Movie'}</p>
                        <p className="text-[10px] text-slate-400">{s.movie?.duration} mins</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <p className="font-semibold text-white">{s.theatre?.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {s.screenName} ({s.theatre?.location?.city})
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{s.showDate}</p>
                      <p className="text-brand-400 font-semibold text-[11px]">{s.showTime}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-black text-white">{bookedSeats}</span>
                      <span className="text-slate-400"> / {totalSeats} booked</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteShow(s._id)}
                        className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400"
                        title="Delete Show"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-cinema-card rounded-2xl border border-cinema-border p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-cinema-border pb-3">
              <h3 className="text-base font-bold text-white">Schedule Movie Showtime</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Movie *</label>
                <select
                  value={formData.movieId}
                  onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  required
                >
                  {movies.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title} ({m.certificate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Cinema *</label>
                <select
                  value={formData.theatreId}
                  onChange={handleTheatreChange}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  required
                >
                  {theatres.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} — {t.location?.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Screen *</label>
                <select
                  value={formData.screenName}
                  onChange={(e) => setFormData({ ...formData, screenName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  required
                >
                  {selectedTheatreObj?.screens?.map((scr) => (
                    <option key={scr.screenNumber} value={scr.screenName}>
                      {scr.screenName} ({scr.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Show Date *</label>
                  <input
                    type="date"
                    value={formData.showDate}
                    onChange={(e) => setFormData({ ...formData, showDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Show Time *</label>
                  <select
                    value={formData.showTime}
                    onChange={(e) => setFormData({ ...formData, showTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="01:30 PM">01:30 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="06:30 PM">06:30 PM</option>
                    <option value="09:45 PM">09:45 PM</option>
                    <option value="10:00 PM">10:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Pricing Tiers */}
              <div className="pt-2 border-t border-cinema-border/60">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Auditorium Tier Pricing (₹)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-amber-400 font-semibold">VIP Recliner</span>
                    <input
                      type="number"
                      value={formData.vipPrice}
                      onChange={(e) => setFormData({ ...formData, vipPrice: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-cinema-border text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-400 font-semibold">Premium</span>
                    <input
                      type="number"
                      value={formData.premiumPrice}
                      onChange={(e) => setFormData({ ...formData, premiumPrice: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-cinema-border text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-300 font-semibold">Standard</span>
                    <input
                      type="number"
                      value={formData.standardPrice}
                      onChange={(e) => setFormData({ ...formData, standardPrice: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-cinema-border text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cinema-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Generating Layout...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShows;

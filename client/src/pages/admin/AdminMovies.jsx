import React, { useState, useEffect } from 'react';
import { Film, Plus, Edit, Trash2, Search, X, Check, Star } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genres: 'Action, Sci-Fi',
    duration: 120,
    language: 'English',
    releaseDate: new Date().toISOString().split('T')[0],
    posterUrl: '',
    bannerUrl: '',
    trailerUrl: '',
    certificate: 'U/A',
    status: 'now_showing',
    isFeatured: false,
    director: '',
  });

  const fetchMovies = async () => {
    try {
      const res = await api.get('/movies', { params: { limit: 100, search } });
      if (res.data.success) {
        setMovies(res.data.data.movies || []);
      }
    } catch (err) {
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [search]);

  const openAddModal = () => {
    setEditingMovie(null);
    setFormData({
      title: '',
      description: '',
      genres: 'Action, Sci-Fi',
      duration: 120,
      language: 'English',
      releaseDate: new Date().toISOString().split('T')[0],
      posterUrl: '',
      bannerUrl: '',
      trailerUrl: '',
      certificate: 'U/A',
      status: 'now_showing',
      isFeatured: false,
      director: '',
    });
    setShowModal(true);
  };

  const openEditModal = (m) => {
    setEditingMovie(m);
    setFormData({
      title: m.title,
      description: m.description,
      genres: m.genres?.join(', ') || '',
      duration: m.duration,
      language: m.language,
      releaseDate: m.releaseDate ? new Date(m.releaseDate).toISOString().split('T')[0] : '',
      posterUrl: m.posterUrl || '',
      bannerUrl: m.bannerUrl || '',
      trailerUrl: m.trailerUrl || '',
      certificate: m.certificate || 'U/A',
      status: m.status,
      isFeatured: Boolean(m.isFeatured),
      director: m.director || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        genres: formData.genres.split(',').map((g) => g.trim()).filter(Boolean),
        duration: Number(formData.duration),
      };

      if (editingMovie) {
        const res = await api.put(`/movies/${editingMovie._id}`, payload);
        if (res.data.success) {
          showToast(`Movie "${payload.title}" updated successfully.`, 'success');
        }
      } else {
        const res = await api.post('/movies', payload);
        if (res.data.success) {
          showToast(`Movie "${payload.title}" added to catalog.`, 'success');
        }
      }

      setShowModal(false);
      fetchMovies();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save movie.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await api.delete(`/movies/${id}`);
      if (res.data.success) {
        showToast(`Movie "${title}" deleted.`, 'info');
        fetchMovies();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Cannot delete movie with active shows.', 'error');
    }
  };

  const toggleStatus = async (movie) => {
    const nextStatus = movie.status === 'now_showing' ? 'coming_soon' : 'now_showing';
    try {
      await api.put(`/movies/${movie._id}`, { status: nextStatus });
      showToast(`Status changed to ${nextStatus}.`, 'success');
      fetchMovies();
    } catch (err) {
      showToast('Failed to update status.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Movie Management</h1>
          <p className="text-xs text-slate-400 mt-1">Manage cinema catalog, posters, and release statuses</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Movie</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter movies by title, director, or cast..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-card border border-cinema-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Movies Table */}
      <div className="rounded-2xl bg-cinema-card border border-cinema-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/80 border-b border-cinema-border">
              <tr>
                <th className="py-3 px-4">Movie</th>
                <th className="py-3 px-4">Genres & Lang</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {movies.map((m) => (
                <tr key={m._id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      className="w-10 h-14 object-cover rounded-lg border border-cinema-border shrink-0"
                    />
                    <div>
                      <p className="font-bold text-white text-sm">{m.title}</p>
                      <p className="text-[11px] text-slate-400">{m.certificate}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <p className="font-semibold">{m.genres?.slice(0, 2).join(', ')}</p>
                    <p className="text-[10px] text-slate-400">{m.language}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{m.duration} mins</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-gold-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-gold-400" />
                      <span>{m.rating > 0 ? m.rating.toFixed(1) : '-'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleStatus(m)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                        m.status === 'now_showing'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {m.status === 'now_showing' ? 'Now Showing' : 'Coming Soon'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(m)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="Edit Movie"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(m._id, m.title)}
                      className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400"
                      title="Delete Movie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Movie Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-cinema-card rounded-2xl border border-cinema-border p-6 space-y-5 shadow-2xl my-8 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-cinema-border pb-3">
              <h3 className="text-base font-bold text-white">
                {editingMovie ? 'Edit Movie Details' : 'Add New Movie'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Movie Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Director</label>
                  <input
                    type="text"
                    value={formData.director}
                    onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Synopsis *</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Mins) *</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Language</label>
                  <input
                    type="text"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Release Date</label>
                  <input
                    type="date"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Genres (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.genres}
                    onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Certificate</label>
                  <select
                    value={formData.certificate}
                    onChange={(e) => setFormData({ ...formData, certificate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="U">U (Universal)</option>
                    <option value="U/A">U/A</option>
                    <option value="A">A (Adults Only)</option>
                    <option value="PG">PG</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="now_showing">Now Showing</option>
                    <option value="coming_soon">Coming Soon</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Poster URL</label>
                  <input
                    type="url"
                    value={formData.posterUrl}
                    onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Backdrop Banner URL</label>
                  <input
                    type="url"
                    value={formData.bannerUrl}
                    onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Trailer YouTube Link</label>
                  <input
                    type="text"
                    value={formData.trailerUrl}
                    onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  />
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
                  {submitting ? 'Saving...' : editingMovie ? 'Update Movie' : 'Create Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMovies;

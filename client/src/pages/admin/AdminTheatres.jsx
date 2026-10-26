import React, { useState, useEffect } from 'react';
import { Clapperboard, Plus, Trash2, Edit, MapPin, X, Check } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminTheatres = () => {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTheatre, setEditingTheatre] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: 'Mumbai',
    state: '',
    contactNumber: '',
    amenities: 'Dolby Atmos, 4K Projection, Recliner Seats',
    screensCount: 2,
  });

  const fetchTheatres = async () => {
    try {
      const res = await api.get('/theatres');
      if (res.data.success) {
        setTheatres(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching theatres:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  const openAddModal = () => {
    setEditingTheatre(null);
    setFormData({
      name: '',
      address: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      contactNumber: '+91 22 4000 1234',
      amenities: 'Dolby Atmos, IMAX, Recliner Seats',
      screensCount: 2,
    });
    setShowModal(true);
  };

  const openEditModal = (t) => {
    setEditingTheatre(t);
    setFormData({
      name: t.name,
      address: t.location?.address || '',
      city: t.location?.city || '',
      state: t.location?.state || '',
      contactNumber: t.contactNumber || '',
      amenities: t.amenities?.join(', ') || '',
      screensCount: t.screens?.length || 2,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
        },
        contactNumber: formData.contactNumber,
        amenities: formData.amenities.split(',').map((a) => a.trim()).filter(Boolean),
        screens: Array.from({ length: Number(formData.screensCount) }).map((_, idx) => ({
          screenNumber: idx + 1,
          screenName: `Audi ${idx + 1} - Standard`,
          capacity: 60,
          seatLayout: {
            totalRows: 6,
            totalCols: 10,
            tiers: [
              { name: 'vip', rows: ['A', 'B'], defaultPrice: 450 },
              { name: 'premium', rows: ['C', 'D'], defaultPrice: 300 },
              { name: 'standard', rows: ['E', 'F'], defaultPrice: 200 },
            ],
          },
        })),
      };

      if (editingTheatre) {
        await api.put(`/theatres/${editingTheatre._id}`, payload);
        showToast(`Theatre "${formData.name}" updated.`, 'success');
      } else {
        await api.post('/theatres', payload);
        showToast(`Theatre "${formData.name}" added successfully.`, 'success');
      }

      setShowModal(false);
      fetchTheatres();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save theatre.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.delete(`/theatres/${id}`);
      showToast(`Theatre "${name}" deleted.`, 'info');
      fetchTheatres();
    } catch (err) {
      showToast(err.response?.data?.message || 'Cannot delete theatre with active shows.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Theatre & Screen Management</h1>
          <p className="text-xs text-slate-400 mt-1">Configure multiplexes, auditoriums, and screen capacities</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Cinema Theatre</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {theatres.map((t) => (
          <div
            key={t._id}
            className="p-6 rounded-2xl bg-cinema-card border border-cinema-border space-y-4 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">{t.name}</h3>
                  <p className="text-xs text-brand-400 font-semibold">{t.location?.city}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t._id, t.name)}
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{t.location?.address}</span>
              </p>

              {/* Screens List */}
              <div className="pt-2 border-t border-cinema-border/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Configured Screens ({t.screens?.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {t.screens?.map((scr) => (
                    <span
                      key={scr.screenNumber}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-700"
                    >
                      {scr.screenName} ({scr.capacity} Seats)
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-cinema-border/60 flex flex-wrap gap-1">
              {t.amenities?.map((a, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-cinema-card rounded-2xl border border-cinema-border p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-cinema-border pb-3">
              <h3 className="text-base font-bold text-white">
                {editingTheatre ? 'Edit Theatre' : 'Add New Cinema Theatre'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Theatre Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="PVR ICON, INOX Megaplex, etc."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Mall Name, Road, Area"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Screens Count</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.screensCount}
                    onChange={(e) => setFormData({ ...formData, screensCount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Amenities</label>
                <input
                  type="text"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="Dolby Atmos, IMAX, Recliners, 4DX"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white focus:outline-none focus:border-brand-500"
                />
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
                  {submitting ? 'Saving...' : editingTheatre ? 'Update Theatre' : 'Create Theatre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTheatres;

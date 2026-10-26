import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Calendar, Clock, MapPin, AlertCircle, Eye, XCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const BookingHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my-bookings');
      if (res.data.success) {
        setBookings(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;

    try {
      setCancellingBookingId(cancelModalBooking.bookingId);
      const res = await api.post(`/bookings/${cancelModalBooking.bookingId}/cancel`, {
        reason: cancelReason || 'Customer requested cancellation',
      });

      if (res.data.success) {
        showToast('Booking cancelled successfully and seats released.', 'success');
        setCancelModalBooking(null);
        setCancelReason('');
        fetchBookings();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel booking.', 'error');
    } finally {
      setCancellingBookingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">My Booking History</h1>
        <p className="text-xs text-slate-400 mt-1">Review your tickets, check QR code passes, and manage bookings</p>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isConfirmed = booking.bookingStatus === 'confirmed';
            const isCancelled = booking.bookingStatus === 'cancelled';

            return (
              <div
                key={booking._id}
                className="p-6 rounded-2xl bg-cinema-card border border-cinema-border space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cinema-border/60">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-brand-400 bg-brand-950/40 px-2.5 py-1 rounded-md border border-brand-500/30">
                      {booking.bookingId}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Booked on {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
                      isConfirmed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isCancelled
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {booking.bookingStatus}
                  </span>
                </div>

                {/* Main Booking Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={booking.movieDetails?.posterUrl}
                      alt={booking.movieDetails?.title}
                      className="w-16 h-24 object-cover rounded-xl border border-cinema-border shrink-0"
                    />
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white">{booking.movieDetails?.title}</h3>
                      <p className="text-xs text-slate-300">
                        {booking.theatreDetails?.name} • {booking.theatreDetails?.screenName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {booking.showDetails?.showDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {booking.showDetails?.showTime}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-200 pt-1">
                        Seats ({booking.seats?.length}):{' '}
                        <span className="text-brand-400 font-black">
                          {booking.seats?.map((s) => s.seatNumber).join(', ')}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Paid</span>
                      <p className="text-lg font-black text-white">₹{booking.totalAmount}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConfirmed && (
                        <>
                          <Link
                            to={`/booking/${booking.bookingId}/confirmation`}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Digital Ticket</span>
                          </Link>

                          <button
                            onClick={() => setCancelModalBooking(booking)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        </>
                      )}

                      {booking.bookingStatus === 'pending' && (
                        <Link
                          to={`/booking/${booking.bookingId}/checkout`}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition"
                        >
                          Complete Payment
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 rounded-2xl bg-cinema-card border border-cinema-border text-center space-y-4">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-lg font-bold text-white">No Bookings Found</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven't booked any cinema tickets yet. Explore now showing blockbusters!
          </p>
          <Link
            to="/movies"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg transition"
          >
            <span>Browse Movies</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-cinema-card rounded-2xl border border-cinema-border p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Confirm Booking Cancellation</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel your booking for{' '}
              <strong className="text-white">{cancelModalBooking.movieDetails?.title}</strong> on{' '}
              {cancelModalBooking.showDetails?.showDate} at {cancelModalBooking.showDetails?.showTime}?
            </p>

            <div className="p-3 rounded-xl bg-slate-900 border border-cinema-border text-[11px] text-slate-400 space-y-1">
              <p>• Refund of ₹{cancelModalBooking.totalAmount} will be recorded.</p>
              <p>• Selected seats ({cancelModalBooking.seats?.map((s) => s.seatNumber).join(', ')}) will be released immediately.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for cancellation (Optional)
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Change of schedule, booked wrong date, etc."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={cancellingBookingId === cancelModalBooking.bookingId}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {cancellingBookingId ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingHistoryPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, AlertTriangle, CheckCircle2, XCircle, ArrowLeft, Ticket } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CheckoutPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('mock'); // 'mock' or 'razorpay'

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        if (res.data.success) {
          setBooking(res.data.data);
          if (res.data.data.bookingStatus === 'confirmed') {
            navigate(`/booking/${bookingId}/confirmation`, { replace: true });
          }
        }
      } catch (err) {
        showToast('Failed to load booking details.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Handle Mock Payment: Success or Failure test simulations
  const handleMockPayment = async (actionType = 'success') => {
    try {
      setProcessingPayment(true);
      const res = await api.post('/payments/verify', {
        bookingId: booking.bookingId,
        provider: 'mock',
        mockAction: actionType,
        paymentMethod: 'mock_instant_test',
      });

      if (actionType === 'success' && res.data.success) {
        showToast('Payment verified successfully! Generating your tickets...', 'success');
        navigate(`/booking/${booking.bookingId}/confirmation`);
      } else {
        showToast('Payment failed. As per policy, your seats have been released.', 'error');
        navigate('/');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Payment simulation failed.', 'error');
      if (actionType === 'failure') {
        navigate('/');
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-white font-bold">Booking reference not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center gap-3 pb-4 border-b border-cinema-border/60">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-cinema-card border border-cinema-border text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white">Payment Checkout</h1>
          <p className="text-xs text-slate-400">Order Reference: {booking.bookingId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Order Ticket Preview */}
        <div className="md:col-span-2 space-y-6">
          {/* Movie & Cinema Card */}
          <div className="p-6 rounded-2xl bg-cinema-card border border-cinema-border space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
              Booking Details
            </h3>

            <div className="flex items-start gap-4">
              <img
                src={booking.movieDetails?.posterUrl}
                alt={booking.movieDetails?.title}
                className="w-16 h-24 object-cover rounded-xl border border-cinema-border shrink-0"
              />
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">{booking.movieDetails?.title}</h2>
                <p className="text-xs text-slate-300 font-medium">
                  {booking.theatreDetails?.name} — {booking.theatreDetails?.screenName}
                </p>
                <p className="text-xs text-brand-400 font-semibold">
                  {booking.showDetails?.showDate} • {booking.showDetails?.showTime}
                </p>
                <div className="pt-1 flex flex-wrap gap-1">
                  {booking.seats?.map((s) => (
                    <span
                      key={s.seatNumber}
                      className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-200 border border-slate-700"
                    >
                      {s.seatNumber} ({s.tier})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="p-6 rounded-2xl bg-cinema-card border border-cinema-border space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Choose Payment Gateway</span>
              <CreditCard className="w-4 h-4 text-brand-400" />
            </h3>

            {/* Mock Gateway Box */}
            <div className="p-4 rounded-xl bg-slate-900 border-2 border-brand-500/80 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-brand-500 ring-4 ring-brand-500/20" />
                  <div>
                    <p className="text-xs font-bold text-white">IMovies Mock Gateway (Evaluator Mode)</p>
                    <p className="text-[11px] text-slate-400">
                      Standard development sandbox: test both success and failure states safely.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-600/20 text-brand-300 border border-brand-500/30">
                  Recommended
                </span>
              </div>

              {/* Action Simulation Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleMockPayment('success')}
                  disabled={processingPayment}
                  className="py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulate Payment Success</span>
                </button>

                <button
                  onClick={() => handleMockPayment('failure')}
                  disabled={processingPayment}
                  className="py-3 px-4 rounded-xl font-bold text-xs bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700/50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Simulate Payment Failure</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Payments are cryptographically verified and total amounts are recalculated server-side.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Price Breakdown */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-cinema-card border border-cinema-border space-y-5 sticky top-24 shadow-2xl">
            <h3 className="text-base font-bold text-white border-b border-cinema-border pb-3">
              Order Total
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Tickets ({booking.seats?.length})</span>
                <span className="font-semibold text-white">₹{booking.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Convenience Fee</span>
                <span>₹{booking.convenienceFee}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (18% on fee)</span>
                <span>₹{booking.tax}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-800 text-base font-black text-white">
                <span>Total Amount</span>
                <span className="text-brand-400">₹{booking.totalAmount}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-cinema-border text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Customer Recipient:</p>
              <p className="truncate">{user?.email}</p>
              <p>{user?.phone || 'No phone supplied'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

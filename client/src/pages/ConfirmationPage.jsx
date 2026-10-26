import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Ticket, Printer, ArrowRight, ShieldCheck, MapPin, Calendar, Clock } from 'lucide-react';
import api from '../services/api';

const ConfirmationPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfirmedBooking = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        if (res.data.success) {
          setBooking(res.data.data);
          // Trigger confetti burst celebration
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (err) {
        console.error('Error fetching confirmed booking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmedBooking();
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
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
        <h2 className="text-xl font-bold text-white">Booking Not Found</h2>
        <Link to="/" className="inline-block px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 print:p-0">
      {/* Top Banner */}
      <div className="text-center space-y-2 print:hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/40 animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Booking Confirmed!</h1>
        <p className="text-xs text-slate-400">
          Your digital cinema ticket has been generated and confirmed in the database.
        </p>
      </div>

      {/* Ticket Pass Container */}
      <div className="relative rounded-3xl bg-cinema-card border border-cinema-border overflow-hidden shadow-2xl print:shadow-none print:border-black">
        {/* Cinema Brand Header */}
        <div className="p-6 bg-gradient-to-r from-brand-700 via-rose-600 to-brand-800 text-white flex items-center justify-between">
          <div>
            <span className="text-xl font-black tracking-tight">IMovies Cinema Pass</span>
            <p className="text-[11px] text-rose-100 uppercase tracking-widest font-semibold">
              Admit One Per Seat
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-rose-200">Booking ID</span>
            <p className="text-sm font-mono font-black">{booking.bookingId}</p>
          </div>
        </div>

        {/* Ticket Details Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <img
              src={booking.movieDetails?.posterUrl}
              alt={booking.movieDetails?.title}
              className="w-24 h-36 object-cover rounded-xl border border-cinema-border shadow-md shrink-0"
            />
            <div className="space-y-2 text-center sm:text-left flex-1">
              <h2 className="text-xl sm:text-2xl font-black text-white">{booking.movieDetails?.title}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-300">
                <span className="px-2 py-0.5 rounded bg-white/10 text-white font-semibold">
                  {booking.movieDetails?.certificate}
                </span>
                <span>{booking.movieDetails?.language}</span>
                <span>•</span>
                <span>{booking.movieDetails?.duration} Mins</span>
              </div>

              <div className="space-y-1 pt-2 text-xs text-slate-300">
                <p className="flex items-center justify-center sm:justify-start gap-1.5 font-semibold text-white">
                  <MapPin className="w-4 h-4 text-brand-400" />
                  <span>
                    {booking.theatreDetails?.name} ({booking.theatreDetails?.screenName})
                  </span>
                </p>
                <p className="text-[11px] text-slate-400 sm:pl-5">{booking.theatreDetails?.address}</p>
              </div>
            </div>
          </div>

          {/* Show Timings & Seats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900 border border-cinema-border text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Date</span>
              <p className="text-xs font-bold text-white mt-0.5">{booking.showDetails?.showDate}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Show Time</span>
              <p className="text-xs font-bold text-white mt-0.5">{booking.showDetails?.showTime}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Seats ({booking.seats?.length})</span>
              <p className="text-xs font-black text-brand-400 mt-0.5">
                {booking.seats?.map((s) => s.seatNumber).join(', ')}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Paid</span>
              <p className="text-xs font-black text-emerald-400 mt-0.5">₹{booking.totalAmount}</p>
            </div>
          </div>

          {/* QR Code & Verification Info */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-cinema-border/60">
            <div className="space-y-1.5 text-center sm:text-left">
              <span className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Digital E-Ticket</span>
              </span>
              <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                Present this QR code at cinema entrance for fast-track verification. No physical printout required.
              </p>
              <Link
                to={`/verify-ticket/${booking.bookingId}`}
                className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 underline inline-block pt-1 print:hidden"
              >
                Open Gatekeeper Public Verification Page
              </Link>
            </div>

            {booking.qrCode && (
              <div className="p-2.5 rounded-2xl bg-white border shadow-md shrink-0">
                <img src={booking.qrCode} alt="Ticket Verification QR" className="w-28 h-28 object-contain" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 print:hidden">
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-cinema-border transition flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save Ticket</span>
        </button>

        <Link
          to="/my-bookings"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-rose-600 hover:from-brand-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-brand-900/40 transition flex items-center justify-center gap-2"
        >
          <span>View All My Bookings</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default ConfirmationPage;

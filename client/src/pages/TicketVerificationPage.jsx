import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ShieldAlert, Film, MapPin, Calendar, Clock, Ticket } from 'lucide-react';
import api from '../services/api';

const TicketVerificationPage = () => {
  const { token } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyTicket = async () => {
      try {
        const res = await api.get(`/tickets/verify/${token}`);
        if (res.data.success) {
          setTicket(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or unrecognizable ticket reference.');
      } finally {
        setLoading(false);
      }
    };

    verifyTicket();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center mx-auto">
          <Ticket className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-white">Ticket Verification Gatekeeper</h1>
        <p className="text-xs text-slate-400">Authenticating digital cinema admission reference</p>
      </div>

      {ticket ? (
        <div className="p-6 rounded-3xl bg-cinema-card border border-cinema-border space-y-6 shadow-2xl">
          {/* Validity Badge */}
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
              ticket.isValid
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
            }`}
          >
            {ticket.isValid ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
            )}
            <div>
              <p className="text-sm font-black uppercase tracking-wide">
                {ticket.isValid ? 'VALID PASS • ADMIT ONE' : `INVALID PASS (${ticket.status})`}
              </p>
              <p className="text-xs opacity-80">
                {ticket.isValid
                  ? 'Payment confirmed and verified in IMovies database.'
                  : 'This ticket is not active or has been cancelled/refunded.'}
              </p>
            </div>
          </div>

          {/* Ticket Facts */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400 font-semibold">Reference ID:</span>
              <span className="font-mono font-bold text-white">{ticket.bookingId}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400 font-semibold">Movie:</span>
              <span className="font-bold text-white">{ticket.movie?.title}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400 font-semibold">Cinema:</span>
              <span className="text-white">
                {ticket.theatre?.name} ({ticket.theatre?.screenName})
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400 font-semibold">Date & Showtime:</span>
              <span className="text-white">
                {ticket.show?.date} at {ticket.show?.time}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400 font-semibold">Reserved Seats:</span>
              <span className="text-brand-400 font-black text-sm">
                {ticket.seats?.join(', ')} ({ticket.seatCount} seats)
              </span>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition inline-block"
            >
              Back to Platform
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-cinema-card border border-rose-500/40 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Verification Failed</h2>
          <p className="text-xs text-rose-300">{error || 'This QR token is not recognized.'}</p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-semibold"
          >
            Go to Homepage
          </Link>
        </div>
      )}
    </div>
  );
};

export default TicketVerificationPage;

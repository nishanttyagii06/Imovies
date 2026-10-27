import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, ShieldCheck, AlertCircle, ArrowLeft, Ticket, Check, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const SeatSelectionPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [show, setShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lockingSeats, setLockingSeats] = useState(false);
  const [lockExpiresAt, setLockExpiresAt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const socketRef = useRef(null);

  // Fetch show details
  const fetchShowDetails = async () => {
    try {
      const res = await api.get(`/shows/${showId}`);
      if (res.data.success) {
        setShow(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load seat layout for this show.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowDetails();

    // Connect to Socket.IO and join show auditorium room
    const socket = getSocket();
    socketRef.current = socket;

    socket.emit('join_show', showId);

    // Listen to real-time seat changes from other users or admin
    socket.on('seats:updated', (data) => {
      if (data.showId === showId) {
        fetchShowDetails();
      }
    });

    return () => {
      socket.emit('leave_show', showId);
      socket.off('seats:updated');
    };
  }, [showId]);

  // Lock Countdown timer
  useEffect(() => {
    if (!lockExpiresAt) return;

    const interval = setInterval(() => {
      const diff = Math.floor((new Date(lockExpiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setRemainingSeconds(0);
        setLockExpiresAt(null);
        setSelectedSeats([]);
        showToast('Your seat reservation has expired. Please select seats again.', 'warning');
        clearInterval(interval);
        fetchShowDetails();
      } else {
        setRemainingSeconds(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockExpiresAt]);

  const handleSeatClick = (seat) => {
    if (seat.status === 'booked') return;
    if (seat.status === 'locked' && !seat.isMine) {
      showToast(`Seat ${seat.seatNumber} is currently reserved by another customer.`, 'warning');
      return;
    }

    const alreadySelected = selectedSeats.some((s) => s.seatNumber === seat.seatNumber);

    if (alreadySelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.seatNumber !== seat.seatNumber));
    } else {
      if (selectedSeats.length >= 8) {
        showToast('You can select a maximum of 8 seats per booking.', 'warning');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  // Proceed to Checkout: Lock seats on server, create booking, navigate to checkout
  const handleProceedToCheckout = async () => {
    if (!user) {
      showToast('Please sign in to complete your seat reservation.', 'info');
      navigate('/login', { state: { from: { pathname: `/booking/${showId}/seats` } } });
      return;
    }

    if (selectedSeats.length === 0) {
      showToast('Please select at least one seat to proceed.', 'warning');
      return;
    }

    try {
      setLockingSeats(true);
      const seatNumbers = selectedSeats.map((s) => s.seatNumber);

      // Step 1: Temporarily Lock Seats
      const lockRes = await api.post(`/shows/${showId}/lock`, { seatNumbers });
      if (!lockRes.data.success) {
        showToast(lockRes.data.message || 'Seat lock failed.', 'error');
        fetchShowDetails();
        return;
      }

      setLockExpiresAt(lockRes.data.data.expiresAt);

      // Step 2: Initialize Checkout Session
      const checkoutRes = await api.post('/bookings/checkout', {
        showId,
        seatNumbers,
      });

      if (checkoutRes.data.success) {
        const booking = checkoutRes.data.data.booking;
        showToast('Seats reserved! Proceeding to payment.', 'success');
        navigate(`/booking/${booking.bookingId}/checkout`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reserve seats.';
      showToast(msg, 'error');
      fetchShowDetails();
    } finally {
      setLockingSeats(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Show Not Found</h2>
        <Link to="/" className="inline-block px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold">
          Back to Movies
        </Link>
      </div>
    );
  }

  // Group seats by Row (e.g. A, B, C, D, E, F)
  const rowsMap = new Map();
  show.seats.forEach((seat) => {
    if (!rowsMap.has(seat.row)) {
      rowsMap.set(seat.row, []);
    }
    rowsMap.get(seat.row).push(seat);
  });
  const rowsArray = Array.from(rowsMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  // Financial calculations
  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = selectedSeats.length * 30;
  const total = subtotal + convenienceFee;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cinema-border/60">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-cinema-card border border-cinema-border text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">{show.movie.title}</h1>
            <p className="text-xs text-slate-400">
              {show.theatre.name} ({show.screenName}) • {show.showDate} at {show.showTime}
            </p>
          </div>
        </div>

        {/* Lock Countdown if active */}
        {lockExpiresAt && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold self-start sm:self-auto">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>
              Lock Expires In: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </span>
          </div>
        )}
      </div>

      {/* Seating Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 p-6 sm:p-10 rounded-2xl bg-[#171126] border border-[#302343] flex flex-col items-center overflow-x-auto">
          {/* Cinema Curved Screen */}
          <div className="w-full max-w-xl mb-12 flex flex-col items-center">
            <div className="w-full h-2.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full shadow-lg shadow-cyan-400/40 glow-screen" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-2">
              Cinema Screen This Way
            </span>
          </div>

          {/* Seat Grid */}
          <div className="space-y-4 min-w-[500px]">
            {rowsArray.map(([rowName, seatsInRow]) => {
              const tierName = seatsInRow[0]?.tier || 'standard';
              const tierPrice = seatsInRow[0]?.price || 200;

              return (
                <div key={rowName} className="flex items-center gap-4">
                  {/* Row Letter */}
                  <div className="w-6 text-center text-xs font-bold text-slate-400">{rowName}</div>

                  {/* Seats in row */}
                  <div className="flex items-center gap-2.5">
                    {seatsInRow.map((seat) => {
                      const isSelected = selectedSeats.some((s) => s.seatNumber === seat.seatNumber);
                      const isBooked = seat.status === 'booked';
                      const isLockedOther = seat.status === 'locked' && !seat.isMine;

                      let seatClasses =
                        'w-8 h-8 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer select-none ';

                      if (isBooked) {
                        seatClasses += 'bg-slate-800 text-slate-600 border border-slate-700/40 cursor-not-allowed';
                      } else if (isLockedOther) {
                        seatClasses += 'bg-amber-950/60 text-amber-500 border border-amber-500/50 cursor-not-allowed animate-pulse';
                      } else if (isSelected) {
                        seatClasses += 'bg-[#8B5CF6] text-white font-extrabold border-2 border-[#A78BFA] shadow-md shadow-[#8B5CF6]/50 scale-110';
                      } else {
                        // Available
                        seatClasses +=
                          seat.tier === 'vip'
                            ? 'bg-amber-950/20 text-amber-300 border border-amber-600/50 hover:bg-amber-600 hover:text-white'
                            : seat.tier === 'premium'
                            ? 'bg-indigo-950/20 text-indigo-300 border border-indigo-600/50 hover:bg-indigo-600 hover:text-white'
                            : 'bg-slate-900 text-slate-300 border border-[#302343] hover:bg-[#8B5CF6]/20 hover:text-white hover:border-[#8B5CF6]/50';
                      }

                      return (
                        <button
                          key={seat.seatNumber}
                          type="button"
                          disabled={isBooked || isLockedOther}
                          onClick={() => handleSeatClick(seat)}
                          className={seatClasses}
                          title={`${seat.seatNumber} • ${seat.tier.toUpperCase()} • ₹${seat.price}`}
                        >
                          {seat.col}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tier Label */}
                  <div className="text-[10px] uppercase font-semibold text-slate-400 w-16">
                    {tierName} (₹{tierPrice})
                  </div>
                </div>
              );
            })}
          </div>

          {/* Seat Legend */}
          <div className="pt-12 mt-12 border-t border-cinema-border/60 w-full flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-slate-900 border border-cinema-border" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-brand-600 border-2 border-brand-400 shadow-sm" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-amber-950/60 border border-amber-500/50" />
              <span>Locked (In Checkout)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700/40" />
              <span>Sold / Booked</span>
            </div>
          </div>
        </div>

        {/* Live Selection Summary Drawer */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-cinema-card border border-cinema-border space-y-6 sticky top-24 shadow-2xl">
            <h3 className="text-base font-bold text-white border-b border-cinema-border pb-3 flex items-center justify-between">
              <span>Booking Summary</span>
              <Ticket className="w-4 h-4 text-brand-400" />
            </h3>

            {/* Selected Seats tags */}
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">Selected Seats:</p>
              {selectedSeats.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeats.map((s) => (
                    <span
                      key={s.seatNumber}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/40 flex items-center gap-1"
                    >
                      <span>{s.seatNumber}</span>
                      <span className="text-[10px] text-slate-400">(₹{s.price})</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No seats selected yet. Click available seats on the layout.</p>
              )}
            </div>

            {/* Pricing details */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Tickets ({selectedSeats.length})</span>
                <span className="font-semibold text-white">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Convenience Fee (₹30/seat)</span>
                <span>₹{convenienceFee}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-800 text-sm font-extrabold text-white">
                <span>Total Payable</span>
                <span className="text-[#A78BFA]">₹{total}</span>
              </div>
            </div>

            {/* Proceed CTA */}
            <button
              onClick={handleProceedToCheckout}
              disabled={selectedSeats.length === 0 || lockingSeats}
              className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-[#8B5CF6] hover:bg-[#A78BFA] shadow-xl shadow-[#8B5CF6]/30 transition transform active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {lockingSeats ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Lock & Proceed to Checkout</span>
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Seats locked for 8 mins with concurrency conflict prevention.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPage;

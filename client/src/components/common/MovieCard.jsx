import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Clock, Bookmark, Ticket } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const MovieCard = ({ movie, onWatchlistChange }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [savingWatchlist, setSavingWatchlist] = useState(false);

  const toggleWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToast('Please sign in to save movies to your watchlist.', 'info');
      navigate('/login');
      return;
    }

    try {
      setSavingWatchlist(true);
      if (inWatchlist) {
        await api.delete(`/watchlist/${movie._id}`);
        setInWatchlist(false);
        showToast(`Removed "${movie.title}" from watchlist.`, 'info');
      } else {
        await api.post(`/watchlist/${movie._id}`);
        setInWatchlist(true);
        showToast(`Added "${movie.title}" to watchlist!`, 'success');
      }
      if (onWatchlistChange) onWatchlistChange();
    } catch (err) {
      showToast('Failed to update watchlist.', 'error');
    } finally {
      setSavingWatchlist(false);
    }
  };

  const isComingSoon = movie.status === 'coming_soon';

  return (
    <div className="group relative rounded-xl bg-[#171126] border border-[#302343] overflow-hidden flex flex-col transition-all duration-300 hover:border-[#8B5CF6]/70 hover:shadow-lg hover:shadow-[#8B5CF6]/25 hover:-translate-y-1">
      {/* Poster Image Container (Exact 2:3 Proportion) */}
      <Link to={`/movies/${movie._id}`} className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900 block">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#171126] via-transparent to-black/40 opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2 inset-x-2 flex items-center justify-between">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-black/70 backdrop-blur-md border border-white/10 text-white">
            {movie.certificate || 'U/A'}
          </span>

          <button
            onClick={toggleWatchlist}
            disabled={savingWatchlist}
            title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            className={`p-1.5 rounded-full backdrop-blur-md transition ${
              inWatchlist
                ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/50'
                : 'bg-black/60 text-slate-300 hover:text-white hover:bg-black/80'
            }`}
          >
            <Bookmark className={`w-3 h-3 ${inWatchlist ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Status / Rating pill on image bottom */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          {isComingSoon ? (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
              Coming Soon
            </span>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/70 border border-gold-400/40 text-gold-400 backdrop-blur-md">
              <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
              <span>{movie.rating > 0 ? movie.rating.toFixed(1) : 'New'}</span>
            </div>
          )}

          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white/15 text-slate-200 backdrop-blur-sm">
            {movie.language}
          </span>
        </div>
      </Link>

      {/* Content Area - Compact height reduced by 15-20% */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
        <div>
          <Link
            to={`/movies/${movie._id}`}
            className="block text-sm font-bold text-[#F5F3FF] group-hover:text-[#A78BFA] transition truncate"
            title={movie.title}
          >
            {movie.title}
          </Link>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 mb-1.5">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{movie.duration}m</span>
            <span>•</span>
            <span className="truncate max-w-[110px]">{movie.genres?.slice(0, 2).join(', ')}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          {isComingSoon ? (
            <Link
              to={`/movies/${movie._id}`}
              className="w-full flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              Details
            </Link>
          ) : (
            <Link
              to={`/shows/${movie._id}`}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-[#8B5CF6] hover:bg-[#A78BFA] text-white shadow-md shadow-[#8B5CF6]/30 transition-all duration-200 transform active:scale-95"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Book Tickets</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;

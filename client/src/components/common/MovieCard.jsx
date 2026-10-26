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
    <div className="group relative rounded-2xl bg-cinema-card border border-cinema-border overflow-hidden flex flex-col transition-all duration-300 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-950/40 hover:-translate-y-1">
      {/* Poster Image Container */}
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
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-card via-transparent to-black/40 opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-black/60 backdrop-blur-md border border-white/10 text-white">
            {movie.certificate || 'U/A'}
          </span>

          <button
            onClick={toggleWatchlist}
            disabled={savingWatchlist}
            title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            className={`p-2 rounded-full backdrop-blur-md transition ${
              inWatchlist
                ? 'bg-brand-600 text-white'
                : 'bg-black/60 text-slate-300 hover:text-white hover:bg-black/80'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${inWatchlist ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Status / Rating pill on image bottom */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          {isComingSoon ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
              Coming Soon
            </span>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-black/70 border border-gold-400/40 text-gold-400 backdrop-blur-md">
              <Star className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
              <span>{movie.rating > 0 ? movie.rating.toFixed(1) : 'New'}</span>
            </div>
          )}

          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-slate-300 backdrop-blur-sm">
            {movie.language}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link
            to={`/movies/${movie._id}`}
            className="block text-base font-bold text-white group-hover:text-brand-400 transition truncate"
            title={movie.title}
          >
            {movie.title}
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 mb-2.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{movie.duration} mins</span>
            <span>•</span>
            <span className="truncate max-w-[130px]">{movie.genres?.slice(0, 2).join(', ')}</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          {isComingSoon ? (
            <Link
              to={`/movies/${movie._id}`}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              View Trailer & Details
            </Link>
          ) : (
            <Link
              to={`/shows/${movie._id}`}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-rose-600 hover:from-brand-500 hover:to-rose-500 text-white shadow-md shadow-brand-900/30 transition transform active:scale-95"
            >
              <Ticket className="w-3.5 h-3.5" />
              Book Tickets
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;

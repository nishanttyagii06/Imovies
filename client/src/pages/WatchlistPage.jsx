import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Ticket, Trash2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const WatchlistPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchWatchlist = async () => {
    try {
      const res = await api.get('/watchlist');
      if (res.data.success) {
        setMovies(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleRemove = async (movieId, title) => {
    try {
      await api.delete(`/watchlist/${movieId}`);
      setMovies(movies.filter((m) => m._id !== movieId));
      showToast(`Removed "${title}" from your watchlist.`, 'info');
    } catch (err) {
      showToast('Failed to remove from watchlist.', 'error');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">My Watchlist</h1>
        <p className="text-xs text-slate-400 mt-1">Movies you've saved to catch on the big screen</p>
      </div>

      {movies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <div
              key={movie._id}
              className="rounded-2xl bg-cinema-card border border-cinema-border overflow-hidden flex flex-col justify-between group hover:border-slate-700 transition"
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-slate-900">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <button
                  onClick={() => handleRemove(movie._id, movie.title)}
                  title="Remove from watchlist"
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-slate-300 hover:text-rose-400 hover:bg-black/90 backdrop-blur-md transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <Link
                    to={`/movies/${movie._id}`}
                    className="block text-sm font-bold text-white group-hover:text-brand-400 transition truncate"
                  >
                    {movie.title}
                  </Link>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {movie.duration} mins • {movie.genres?.join(', ')}
                  </p>
                </div>

                <div className="pt-2">
                  {movie.status === 'now_showing' ? (
                    <Link
                      to={`/shows/${movie._id}`}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      Book Tickets
                    </Link>
                  ) : (
                    <Link
                      to={`/movies/${movie._id}`}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    >
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 rounded-2xl bg-cinema-card border border-cinema-border text-center space-y-4">
          <Bookmark className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-lg font-bold text-white">Your Watchlist is Empty</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Bookmark interesting movies from our catalog so you never miss an upcoming cinema release!
          </p>
          <Link
            to="/movies"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg transition"
          >
            <span>Explore Movies</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default WatchlistPage;

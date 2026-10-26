import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sparkles, Star, Play, ChevronRight, Compass } from 'lucide-react';
import api from '../services/api';
import MovieCard from '../components/common/MovieCard';
import { MovieCardSkeleton } from '../components/common/LoadingSkeleton';

const HomePage = () => {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const genresList = ['All', 'Action', 'Sci-Fi', 'Adventure', 'Drama', 'Animation', 'Biography'];

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await api.get('/movies/featured');
        if (res.data.success) {
          setFeaturedMovies(res.data.data.featured || []);
          setNowShowing(res.data.data.nowShowing || []);
          setComingSoon(res.data.data.comingSoon || []);
        }
      } catch (err) {
        console.error('Failed to load homepage movies:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const activeMovie = featuredMovies[activeHeroIndex] || nowShowing[0];

  return (
    <div className="space-y-16 pb-16">
      {/* ==================================================== */}
      {/* 1. HERO BANNER SLIDER */}
      {/* ==================================================== */}
      {activeMovie && (
        <section className="relative min-h-[580px] md:min-h-[640px] flex items-end overflow-hidden">
          {/* Background image & gradient masks */}
          <div className="absolute inset-0 z-0">
            <img
              src={activeMovie.bannerUrl || activeMovie.posterUrl}
              alt={activeMovie.title}
              className="w-full h-full object-cover object-center filter brightness-[0.45] transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-darkest via-cinema-darkest/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-darkest via-cinema-darkest/60 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-600/30 text-brand-400 border border-brand-500/40 backdrop-blur-md flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  Trending Blockbuster
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-slate-200">
                  {activeMovie.certificate || 'U/A'}
                </span>
                <div className="flex items-center gap-1 text-gold-400 text-xs font-bold bg-black/60 px-2.5 py-1 rounded-md border border-gold-400/30">
                  <Star className="w-3.5 h-3.5 fill-gold-400" />
                  <span>{activeMovie.rating > 0 ? activeMovie.rating.toFixed(1) : '9.5'}</span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
                {activeMovie.title}
              </h1>

              <p className="text-slate-300 text-sm sm:text-base line-clamp-3 leading-relaxed max-w-xl">
                {activeMovie.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300 pt-2">
                <span>{activeMovie.duration} Mins</span>
                <span>•</span>
                <span>{activeMovie.language}</span>
                <span>•</span>
                <span className="text-brand-400">{activeMovie.genres?.join(', ')}</span>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Link
                  to={`/shows/${activeMovie._id}`}
                  className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-rose-600 hover:from-brand-500 hover:to-rose-500 shadow-xl shadow-brand-900/40 transition transform hover:-translate-y-0.5 active:scale-95"
                >
                  Book Tickets Now
                </Link>
                <Link
                  to={`/movies/${activeMovie._id}`}
                  className="px-5 py-3.5 rounded-xl font-semibold text-sm text-slate-200 bg-white/10 hover:bg-white/20 backdrop-blur-md transition flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Watch Trailer
                </Link>
              </div>
            </div>

            {/* Quick Hero Thumbnails */}
            {featuredMovies.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {featuredMovies.map((m, idx) => (
                  <button
                    key={m._id}
                    onClick={() => setActiveHeroIndex(idx)}
                    className={`relative w-16 h-24 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      activeHeroIndex === idx
                        ? 'border-brand-500 scale-105 shadow-lg shadow-brand-500/40 ring-2 ring-brand-500/40'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==================================================== */}
      {/* 2. SEARCH & GENRE PILL BAR */}
      {/* ==================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-4 sm:p-6 rounded-2xl bg-cinema-card border border-cinema-border shadow-xl space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies by title, cast, or director..."
              className="w-full pl-12 pr-28 py-3.5 rounded-xl bg-slate-900/90 border border-cinema-border text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white transition"
            >
              Search
            </button>
          </form>

          {/* Genre filter tags */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-brand-500" /> Genres:
            </span>
            {genresList.map((g) => (
              <button
                key={g}
                onClick={() => navigate(g === 'All' ? '/movies' : `/movies?genre=${g}`)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-800/80 hover:bg-brand-600/30 hover:text-brand-300 border border-slate-700/60 text-slate-300 transition shrink-0"
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* 3. NOW SHOWING MOVIES */}
      {/* ==================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Now Showing</h2>
            <p className="text-xs text-slate-400 mt-0.5">Explore movies currently screening in your nearest cinemas</p>
          </div>
          <Link
            to="/movies?status=now_showing"
            className="flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300 transition"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : nowShowing.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {nowShowing.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 bg-cinema-card rounded-2xl border border-cinema-border">
            No movies currently showing.
          </div>
        )}
      </section>

      {/* ==================================================== */}
      {/* 4. COMING SOON SECTION */}
      {/* ==================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Coming Soon</h2>
            <p className="text-xs text-slate-400 mt-0.5">Upcoming releases you can look forward to</p>
          </div>
          <Link
            to="/movies?status=coming_soon"
            className="flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300 transition"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : comingSoon.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {comingSoon.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 bg-cinema-card rounded-2xl border border-cinema-border">
            No upcoming movies scheduled.
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;

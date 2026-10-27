import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import api from '../services/api';
import MovieCard from '../components/common/MovieCard';
import { MovieCardSkeleton } from '../components/common/LoadingSkeleton';

const MoviesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters from query params
  const search = searchParams.get('search') || '';
  const genre = searchParams.get('genre') || 'All';
  const language = searchParams.get('language') || 'All';
  const status = searchParams.get('status') || 'all';
  const sort = searchParams.get('sort') || '-rating';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const genres = ['All', 'Action', 'Sci-Fi', 'Adventure', 'Drama', 'Animation', 'Biography', 'History', 'Comedy'];
  const languages = ['All', 'English', 'Hindi', 'Telugu', 'Tamil'];
  const statuses = [
    { label: 'All Releases', value: 'all' },
    { label: 'Now Showing', value: 'now_showing' },
    { label: 'Coming Soon', value: 'coming_soon' },
  ];

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (genre !== 'All') queryParams.set('genre', genre);
        if (language !== 'All') queryParams.set('language', language);
        if (status !== 'all') queryParams.set('status', status);
        queryParams.set('sort', sort);
        queryParams.set('page', page);
        queryParams.set('limit', 15);

        const res = await api.get(`/movies?${queryParams.toString()}`);
        if (res.data.success) {
          setMovies(res.data.data.movies || []);
          setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0 });
        }
      } catch (err) {
        console.error('Error fetching movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [search, genre, language, status, sort, page]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'All' && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // reset to page 1 on filter change
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Movie Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse through latest theatrical releases, filter by your favorite genres, and find showtimes.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-400 bg-[#171126] px-4 py-2 rounded-xl border border-[#302343] self-start md:self-auto">
          Showing <span className="text-white font-bold">{movies.length}</span> of{' '}
          <span className="text-[#A78BFA] font-bold">{pagination.total}</span> titles
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-5 rounded-2xl bg-[#171126] border border-[#302343] space-y-4 shadow-xl">
        {/* Top Search & Sort Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
              placeholder="Search by movie title, cast, or director..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-[#302343] text-sm text-[#F5F3FF] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
            />
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-[#302343] text-xs text-slate-200 focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
            >
              <option value="-rating">Top Rated First</option>
              <option value="-releaseDate">Newest Releases</option>
              <option value="releaseDate">Upcoming Dates</option>
              <option value="title">Alphabetical (A - Z)</option>
              <option value="-duration">Longest Duration</option>
            </select>
          </div>
        </div>

        {/* Filters Row */}
        <div className="pt-2 border-t border-[#302343]/60 flex flex-wrap items-center gap-4 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Status:</span>
            <div className="flex rounded-lg bg-slate-900 p-0.5 border border-[#302343]">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => updateParam('status', s.value)}
                  className={`px-3 py-1 rounded-md text-[11px] font-medium transition ${
                    status === s.value
                      ? 'bg-[#8B5CF6] text-white font-bold shadow-sm shadow-[#8B5CF6]/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genre Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Genre:</span>
            <select
              value={genre}
              onChange={(e) => updateParam('genre', e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-[#302343] text-slate-200 text-xs focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
            >
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Language Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Language:</span>
            <select
              value={language}
              onChange={(e) => updateParam('language', e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-[#302343] text-slate-200 text-xs focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
            >
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(search || genre !== 'All' || language !== 'All' || status !== 'all') && (
            <button
              onClick={() => setSearchParams({})}
              className="text-[#A78BFA] hover:text-[#C4B5FD] underline font-semibold ml-auto text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Movie Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 sm:gap-5">
          {[...Array(10)].map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 sm:gap-5">
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="p-16 rounded-2xl bg-[#171126] border border-[#302343] text-center space-y-4">
          <p className="text-base text-slate-300 font-medium">
            No movies match your selected search criteria.
          </p>
          <button
            onClick={() => setSearchParams({})}
            className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#A78BFA] text-xs font-bold text-white transition shadow-md shadow-[#8B5CF6]/30"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          {[...Array(pagination.pages)].map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                onClick={() => updateParam('page', pageNum.toString())}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                  page === pageNum
                    ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/40'
                    : 'bg-[#171126] border border-[#302343] text-slate-300 hover:bg-[#201735]'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MoviesPage;

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Sparkles, ChevronRight, Ticket } from 'lucide-react';
import api from '../services/api';
import { ShowtimeSkeleton } from '../components/common/LoadingSkeleton';

const ShowtimesPage = ({ defaultCity = 'Mumbai' }) => {
  const { movieId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [theatres, setTheatres] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(defaultCity);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Generate 6 upcoming dates
  const nextDates = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      full: d.toISOString().split('T')[0],
      day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  // Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await api.get('/theatres/cities');
        if (res.data.success) {
          setCities(res.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching cities:', err);
      }
    };
    fetchCities();
  }, []);

  // Fetch shows
  useEffect(() => {
    const fetchShows = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/shows/movie/${movieId}`, {
          params: {
            date: selectedDate,
            city: selectedCity,
          },
        });
        if (res.data.success) {
          setMovie(res.data.data.movie);
          setTheatres(res.data.data.theatres || []);
        }
      } catch (err) {
        console.error('Error fetching showtimes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShows();
  }, [movieId, selectedDate, selectedCity]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Movie Mini Header */}
      {movie && (
        <div className="p-6 rounded-2xl bg-cinema-card border border-cinema-border flex flex-col sm:flex-row items-center gap-6">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-20 h-28 object-cover rounded-xl border border-cinema-border shadow-lg shrink-0"
          />
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-600/30 text-brand-400 border border-brand-500/30">
                {movie.certificate}
              </span>
              <span className="text-xs text-slate-400">{movie.language}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-400">{movie.duration} Mins</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {movie.title}
            </h1>
            <p className="text-xs text-brand-400 font-semibold">{movie.genres?.join(', ')}</p>
          </div>
          <Link
            to={`/movies/${movieId}`}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition shrink-0"
          >
            Movie Info
          </Link>
        </div>
      )}

      {/* Date Switcher & City Selector Bar */}
      <div className="p-4 rounded-2xl bg-cinema-card border border-cinema-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Date Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {nextDates.map((item) => {
            const isSelected = selectedDate === item.full;
            return (
              <button
                key={item.full}
                onClick={() => setSelectedDate(item.full)}
                className={`px-4 py-2.5 rounded-xl flex flex-col items-center justify-center min-w-[70px] transition shrink-0 ${
                  isSelected
                    ? 'bg-[#8B5CF6] text-white font-bold shadow-lg shadow-[#8B5CF6]/40 ring-1 ring-[#A78BFA]/50'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-[#201735] border border-[#302343]'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider">{item.day}</span>
                <span className="text-sm font-extrabold">{item.dateNum}</span>
                <span className="text-[10px] text-slate-300">{item.month}</span>
              </button>
            );
          })}
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2 bg-slate-900 px-3.5 py-2.5 rounded-xl border border-[#302343] self-end md:self-auto shrink-0">
          <MapPin className="w-4 h-4 text-[#8B5CF6]" />
          <span className="text-xs text-slate-400">City:</span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value="All" className="bg-cinema-darkest text-slate-200">
              All Cities
            </option>
            {cities.map((city) => (
              <option key={city} value={city} className="bg-cinema-darkest text-slate-200">
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Theatres & Shows List */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <ShowtimeSkeleton />
            <ShowtimeSkeleton />
            <ShowtimeSkeleton />
          </div>
        ) : theatres.length > 0 ? (
          theatres.map((item) => (
            <div
              key={item.theatre._id}
              className="p-6 rounded-2xl bg-[#171126] border border-[#302343] space-y-5 hover:border-[#8B5CF6]/50 transition"
            >
              {/* Theatre Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#302343]/60">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{item.theatre.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-slate-300">
                      {item.theatre.location?.city}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{item.theatre.location?.address}</p>
                </div>

                {/* Amenities pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.theatre.amenities?.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Showtimes Grid */}
              <div className="flex flex-wrap gap-4 items-center">
                {item.shows.map((show) => (
                  <button
                    key={show._id}
                    onClick={() => navigate(`/booking/${show._id}/seats`)}
                    className="group relative p-3 rounded-xl bg-slate-900 border border-[#302343] hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-all text-left min-w-[130px]"
                  >
                    <div className="flex items-center gap-1.5 text-sm font-black text-white group-hover:text-[#A78BFA]">
                      <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      <span>{show.showTime}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 truncate">
                      {show.screenName}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800 text-[10px]">
                      <span className="text-slate-400">From ₹{show.pricing?.standard || 200}</span>
                      <span className="text-emerald-400 font-semibold">{show.availableSeats} Left</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="p-16 rounded-2xl bg-[#171126] border border-[#302343] text-center space-y-3">
            <Ticket className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No Shows Available</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No shows are scheduled for this date in {selectedCity}. Try choosing another date or city above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowtimesPage;

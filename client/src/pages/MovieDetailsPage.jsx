import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Clock, Calendar, Ticket, Bookmark, Play, X, User, MessageSquare } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const MovieDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        const [movieRes, reviewsRes] = await Promise.all([
          api.get(`/movies/${id}`),
          api.get(`/reviews/movie/${id}`),
        ]);

        if (movieRes.data.success) {
          setMovie(movieRes.data.data);
        }
        if (reviewsRes.data.success) {
          setReviews(reviewsRes.data.data);
        }

        // Check watchlist if user logged in
        if (user) {
          const wlRes = await api.get(`/watchlist/check/${id}`);
          if (wlRes.data.success) {
            setInWatchlist(wlRes.data.data.inWatchlist);
          }
        }
      } catch (err) {
        console.error('Error fetching movie details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id, user]);

  const toggleWatchlist = async () => {
    if (!user) {
      showToast('Please sign in to save this movie.', 'info');
      navigate('/login');
      return;
    }

    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${id}`);
        setInWatchlist(false);
        showToast('Removed from your watchlist.', 'info');
      } else {
        await api.post(`/watchlist/${id}`);
        setInWatchlist(true);
        showToast('Saved to your watchlist!', 'success');
      }
    } catch (err) {
      showToast('Error updating watchlist.', 'error');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to write a review.', 'info');
      navigate('/login');
      return;
    }

    if (!myComment.trim()) {
      showToast('Please enter your review feedback.', 'warning');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await api.post('/reviews', {
        movieId: id,
        rating: myRating,
        comment: myComment.trim(),
      });

      if (res.data.success) {
        showToast('Your review has been submitted!', 'success');
        setReviews([res.data.data, ...reviews]);
        setShowReviewModal(false);
        setMyComment('');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Movie Not Found</h2>
        <p className="text-sm text-slate-400">The movie you are looking for does not exist or has been removed.</p>
        <Link to="/movies" className="inline-block px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs">
          Browse All Movies
        </Link>
      </div>
    );
  }

  // Format YouTube embed URL safely
  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Top Hero Banner */}
      <div className="relative min-h-[480px] md:min-h-[540px] flex items-end">
        <div className="absolute inset-0 z-0">
          <img
            src={movie.bannerUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover filter brightness-[0.35]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-darkest via-cinema-darkest/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-darkest via-transparent to-cinema-darkest/70" />
        </div>

        {/* Content Box */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            {/* Poster Card */}
            <div className="w-48 sm:w-60 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-cinema-border shadow-2xl shrink-0 group relative">
              <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
              {movie.trailerUrl && (
                <button
                  onClick={() => setShowTrailerModal(true)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 text-white transition backdrop-blur-xs"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/50">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Play Trailer</span>
                </button>
              )}
            </div>

            {/* Details Column */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <span className="px-3 py-1 rounded-md text-xs font-bold uppercase bg-brand-600/30 text-brand-400 border border-brand-500/30">
                  {movie.status === 'now_showing' ? 'Now Showing' : 'Coming Soon'}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-slate-200">
                  {movie.certificate}
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-black/60 border border-gold-400/30 text-gold-400 font-bold text-xs">
                  <Star className="w-4 h-4 fill-gold-400" />
                  <span>{movie.rating > 0 ? movie.rating.toFixed(1) : 'New'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({movie.ratingCount} reviews)</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-slate-300">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{movie.duration} Minutes</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Released: {new Date(movie.releaseDate).toLocaleDateString()}</span>
                </div>
                <span>•</span>
                <span className="text-brand-400 font-semibold">{movie.language}</span>
              </div>

              {/* Genre Pills */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                {movie.genres?.map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center justify-center md:justify-start gap-4">
                {movie.status === 'now_showing' ? (
                  <Link
                    to={`/shows/${movie._id}`}
                    className="px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-rose-600 hover:from-brand-500 hover:to-rose-500 shadow-xl shadow-brand-900/40 transition transform active:scale-95 flex items-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    Book Tickets
                  </Link>
                ) : (
                  <div className="px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                    Releasing Soon in Cinemas
                  </div>
                )}

                <button
                  onClick={toggleWatchlist}
                  className={`px-5 py-3.5 rounded-xl font-semibold text-xs transition border flex items-center gap-2 ${
                    inWatchlist
                      ? 'bg-brand-600/30 text-brand-300 border-brand-500/40'
                      : 'bg-cinema-card text-slate-300 border-cinema-border hover:bg-slate-800'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${inWatchlist ? 'fill-brand-400' : ''}`} />
                  {inWatchlist ? 'Saved in Watchlist' : 'Add to Watchlist'}
                </button>

                {movie.trailerUrl && (
                  <button
                    onClick={() => setShowTrailerModal(true)}
                    className="px-5 py-3.5 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Watch Trailer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Synopsis & Cast */}
        <div className="lg:col-span-2 space-y-10">
          {/* Synopsis */}
          <section className="space-y-3 p-6 rounded-2xl bg-cinema-card border border-cinema-border">
            <h2 className="text-xl font-bold text-white tracking-tight">About the Movie</h2>
            <p className="text-slate-300 text-sm leading-relaxed">{movie.description}</p>
            {movie.director && (
              <div className="pt-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Director:</span> {movie.director}
              </div>
            )}
          </section>

          {/* Cast */}
          {movie.cast && movie.cast.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white tracking-tight">Starring Cast</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {movie.cast.map((actor, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-cinema-card border border-cinema-border flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{actor.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{actor.role || 'Cast'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews List */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Audience Reviews</h2>
                <p className="text-xs text-slate-400 mt-0.5">{reviews.length} community ratings</p>
              </div>
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Write Review
              </button>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="p-5 rounded-2xl bg-cinema-card border border-cinema-border space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-600/20 text-brand-400 font-bold text-xs flex items-center justify-center border border-brand-500/30">
                          {rev.user?.name ? rev.user.name[0] : 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{rev.user?.name || 'Verified Customer'}</p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gold-400 text-xs font-bold bg-black/40 px-2 py-1 rounded-md border border-gold-400/20">
                        <Star className="w-3 h-3 fill-gold-400" />
                        <span>{rev.rating} / 5</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-cinema-card border border-cinema-border text-center text-slate-400 text-xs space-y-3">
                <p>No reviews submitted yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Quick Booking Info Box */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-cinema-card border border-cinema-border space-y-5 sticky top-24">
            <h3 className="text-base font-bold text-white border-b border-cinema-border pb-3">
              Screening Quick Facts
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Format</span>
                <span className="text-white font-semibold">2D, 3D, IMAX Laser, 4DX</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Sound</span>
                <span className="text-white font-semibold">Dolby Atmos 7.1</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Rating</span>
                <span className="text-gold-400 font-bold">{movie.rating > 0 ? `${movie.rating}/5` : 'Unrated'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Censor</span>
                <span className="text-white font-semibold">{movie.certificate}</span>
              </div>
            </div>

            {movie.status === 'now_showing' && (
              <Link
                to={`/shows/${movie._id}`}
                className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-600 to-rose-600 hover:from-brand-500 hover:to-rose-500 shadow-xl shadow-brand-900/40 text-center block transition"
              >
                Check Theatres & Times
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-cinema-card rounded-2xl border border-cinema-border overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-cinema-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{movie.title} — Official Trailer</h3>
              <button
                onClick={() => setShowTrailerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={getEmbedUrl(movie.trailerUrl)}
                title="Movie Trailer"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-cinema-card rounded-2xl border border-cinema-border p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-cinema-border pb-3">
              <h3 className="text-base font-bold text-white">Rate & Review Movie</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Your Rating (1 to 5 Stars):
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setMyRating(star)}
                      className="p-1 text-gold-400 transition transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${star <= myRating ? 'fill-gold-400' : 'text-slate-600'}`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-gold-400 ml-2">{myRating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Written Review:
                </label>
                <textarea
                  rows={4}
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  placeholder="What did you think of the performances, plot, sound design, and visuals?"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetailsPage;

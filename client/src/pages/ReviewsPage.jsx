import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MessageSquare, ArrowLeft, Trash2, Edit3, User } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ReviewsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviewsData = async () => {
    try {
      const [mRes, rRes] = await Promise.all([
        api.get(`/movies/${id}`),
        api.get(`/reviews/movie/${id}`),
      ]);
      if (mRes.data.success) setMovie(mRes.data.data);
      if (rRes.data.success) setReviews(rRes.data.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsData();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to write a review.', 'info');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/reviews', {
        movieId: id,
        rating,
        comment: comment.trim(),
      });
      if (res.data.success) {
        showToast('Review posted successfully!', 'success');
        setShowAddModal(false);
        setComment('');
        fetchReviewsData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      showToast('Review deleted.', 'info');
      setReviews(reviews.filter((r) => r._id !== reviewId));
    } catch (err) {
      showToast('Failed to delete review.', 'error');
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cinema-border/60">
        <div className="flex items-center gap-4">
          <Link
            to={`/movies/${id}`}
            className="p-2 rounded-xl bg-cinema-card border border-cinema-border text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Reviews & Ratings</h1>
            <p className="text-xs text-slate-400">{movie?.title}</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Ratings Overview Card */}
      {movie && (
        <div className="p-6 rounded-2xl bg-cinema-card border border-cinema-border flex items-center gap-6">
          <div className="text-center sm:text-left">
            <div className="text-4xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
              <Star className="w-8 h-8 fill-gold-400 text-gold-400" />
              <span>{movie.rating > 0 ? movie.rating.toFixed(1) : 'New'}</span>
              <span className="text-sm text-slate-400 font-normal">/ 5</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Based on {movie.ratingCount} user ratings</p>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((rev) => {
            const isMyReview = user && rev.user?._id === user.id;

            return (
              <div
                key={rev._id}
                className="p-5 rounded-2xl bg-cinema-card border border-cinema-border space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-700">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{rev.user?.name || 'Verified Moviegoer'}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-gold-400 text-xs font-bold bg-black/50 px-2.5 py-1 rounded-md border border-gold-400/20">
                      <Star className="w-3.5 h-3.5 fill-gold-400" />
                      <span>{rev.rating} / 5</span>
                    </div>

                    {(isMyReview || user?.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteReview(rev._id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>
              </div>
            );
          })
        ) : (
          <div className="p-16 rounded-2xl bg-cinema-card border border-cinema-border text-center text-slate-400 text-xs">
            No reviews submitted yet for this movie.
          </div>
        )}
      </div>

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-cinema-card rounded-2xl border border-cinema-border p-6 space-y-4 shadow-2xl animate-fade-in">
            <h3 className="text-base font-bold text-white">Share Your Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Score</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 text-gold-400"
                    >
                      <Star
                        className={`w-7 h-7 ${star <= rating ? 'fill-gold-400' : 'text-slate-600'}`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-gold-400 ml-2">{rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Feedback</label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you liked about the direction, audio, and performances..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-cinema-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;

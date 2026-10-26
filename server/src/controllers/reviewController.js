const Review = require('../models/Review');
const Movie = require('../models/Movie');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @desc    Get all reviews for a movie
 * @route   GET /api/reviews/movie/:movieId
 * @access  Public
 */
const getMovieReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      movie: req.params.movieId,
      isApproved: true,
    })
      .populate('user', 'name username')
      .sort('-createdAt');

    return successResponse(res, 200, 'Reviews retrieved', reviews);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add review for a movie
 * @route   POST /api/reviews
 * @access  Private
 */
const addReview = async (req, res, next) => {
  try {
    const { movieId, rating, comment } = req.body;

    if (!movieId || !rating || !comment) {
      return errorResponse(res, 400, 'Movie ID, rating (1-5), and written comment are required.');
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return errorResponse(res, 400, 'Rating must be a number between 1 and 5.');
    }

    // Check if user already reviewed
    const existing = await Review.findOne({ movie: movieId, user: req.user.id });
    if (existing) {
      return errorResponse(res, 400, 'You have already reviewed this movie. You can edit your existing review.');
    }

    const review = await Review.create({
      movie: movieId,
      user: req.user.id,
      rating: numRating,
      comment: comment.trim(),
    });

    const populated = await Review.findById(review._id).populate('user', 'name username');

    return successResponse(res, 201, 'Review submitted successfully', populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
const updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }

    if (review.user.toString() !== req.user.id.toString()) {
      return errorResponse(res, 403, 'Unauthorized to edit this review.');
    }

    if (rating) {
      const numRating = Number(rating);
      if (numRating >= 1 && numRating <= 5) {
        review.rating = numRating;
      }
    }
    if (comment) {
      review.comment = comment.trim();
    }

    await review.save();
    return successResponse(res, 200, 'Review updated successfully', review);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }

    const isOwner = review.user.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 403, 'Unauthorized to delete this review.');
    }

    await Review.findByIdAndDelete(req.params.id);
    return successResponse(res, 200, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovieReviews,
  addReview,
  updateReview,
  deleteReview,
};

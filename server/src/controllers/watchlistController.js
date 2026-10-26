const Watchlist = require('../models/Watchlist');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @desc    Get user's watchlist
 * @route   GET /api/watchlist
 * @access  Private
 */
const getWatchlist = async (req, res, next) => {
  try {
    let list = await Watchlist.findOne({ user: req.user.id }).populate('movies');
    if (!list) {
      list = await Watchlist.create({ user: req.user.id, movies: [] });
    }
    return successResponse(res, 200, 'Watchlist retrieved', list.movies);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add movie to watchlist
 * @route   POST /api/watchlist/:movieId
 * @access  Private
 */
const addToWatchlist = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    let list = await Watchlist.findOne({ user: req.user.id });

    if (!list) {
      list = await Watchlist.create({ user: req.user.id, movies: [movieId] });
    } else {
      if (!list.movies.includes(movieId)) {
        list.movies.push(movieId);
        await list.save();
      }
    }

    return successResponse(res, 200, 'Movie added to watchlist');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove movie from watchlist
 * @route   DELETE /api/watchlist/:movieId
 * @access  Private
 */
const removeFromWatchlist = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const list = await Watchlist.findOne({ user: req.user.id });

    if (list) {
      list.movies = list.movies.filter((id) => id.toString() !== movieId);
      await list.save();
    }

    return successResponse(res, 200, 'Movie removed from watchlist');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check if movie is in watchlist
 * @route   GET /api/watchlist/check/:movieId
 * @access  Private
 */
const checkWatchlistStatus = async (req, res, next) => {
  try {
    const list = await Watchlist.findOne({ user: req.user.id });
    const inWatchlist = list ? list.movies.some((id) => id.toString() === req.params.movieId) : false;
    return successResponse(res, 200, 'Watchlist status', { inWatchlist });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlistStatus,
};

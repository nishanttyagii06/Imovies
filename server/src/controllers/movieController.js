const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @desc    Get all movies with filters, search, and pagination
 * @route   GET /api/movies
 * @access  Public
 */
const getMovies = async (req, res, next) => {
  try {
    const {
      search,
      genre,
      language,
      status,
      minRating,
      sort = '-createdAt',
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { director: { $regex: search, $options: 'i' } },
        { 'cast.name': { $regex: search, $options: 'i' } },
      ];
    }

    if (genre && genre !== 'All') {
      query.genres = { $in: [genre] };
    }

    if (language && language !== 'All') {
      query.language = { $regex: `^${language}$`, $options: 'i' };
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 12;
    const skip = (pageNumber - 1) * pageSize;

    const [movies, total] = await Promise.all([
      Movie.find(query).sort(sort).skip(skip).limit(pageSize),
      Movie.countDocuments(query),
    ]);

    return successResponse(res, 200, 'Movies fetched successfully', {
      movies,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize) || 1,
        limit: pageSize,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get featured and trending movies for homepage banner
 * @route   GET /api/movies/featured
 * @access  Public
 */
const getFeaturedMovies = async (req, res, next) => {
  try {
    const featured = await Movie.find({ isFeatured: true, status: 'now_showing' }).limit(5);
    const nowShowing = await Movie.find({ status: 'now_showing' }).sort('-rating').limit(8);
    const comingSoon = await Movie.find({ status: 'coming_soon' }).sort('releaseDate').limit(8);

    return successResponse(res, 200, 'Featured movies fetched', {
      featured: featured.length > 0 ? featured : nowShowing.slice(0, 3),
      nowShowing,
      comingSoon,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single movie by ID
 * @route   GET /api/movies/:id
 * @access  Public
 */
const getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return errorResponse(res, 404, 'Movie not found');
    }
    return successResponse(res, 200, 'Movie details retrieved', movie);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new movie
 * @route   POST /api/movies
 * @access  Private/Admin
 */
const createMovie = async (req, res, next) => {
  try {
    const {
      title,
      description,
      genres,
      duration,
      language,
      releaseDate,
      posterUrl,
      bannerUrl,
      trailerUrl,
      certificate,
      status,
      isFeatured,
      cast,
      director,
    } = req.body;

    if (!title || !description || !genres || !duration || !releaseDate) {
      return errorResponse(res, 400, 'Title, description, genres, duration, and release date are required.');
    }

    const movie = await Movie.create({
      title,
      description,
      genres: Array.isArray(genres) ? genres : [genres],
      duration: Number(duration),
      language: language || 'English',
      releaseDate,
      posterUrl: posterUrl || undefined,
      bannerUrl: bannerUrl || undefined,
      trailerUrl: trailerUrl || undefined,
      certificate: certificate || 'U/A',
      status: status || 'now_showing',
      isFeatured: Boolean(isFeatured),
      cast: Array.isArray(cast) ? cast : [],
      director: director || '',
    });

    return successResponse(res, 201, 'Movie created successfully', movie);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update movie details
 * @route   PUT /api/movies/:id
 * @access  Private/Admin
 */
const updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      return errorResponse(res, 404, 'Movie not found');
    }

    return successResponse(res, 200, 'Movie updated successfully', movie);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete movie (safeguards against active shows)
 * @route   DELETE /api/movies/:id
 * @access  Private/Admin
 */
const deleteMovie = async (req, res, next) => {
  try {
    const movieId = req.params.id;

    // Check if there are active shows for this movie
    const activeShowsCount = await Show.countDocuments({
      movie: movieId,
      isActive: true,
    });

    if (activeShowsCount > 0) {
      return errorResponse(
        res,
        400,
        `Cannot delete movie. There are ${activeShowsCount} active shows scheduled for this movie. Cancel or remove the shows first.`
      );
    }

    const movie = await Movie.findByIdAndDelete(movieId);
    if (!movie) {
      return errorResponse(res, 404, 'Movie not found');
    }

    return successResponse(res, 200, 'Movie deleted successfully', { id: movieId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovies,
  getFeaturedMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
};

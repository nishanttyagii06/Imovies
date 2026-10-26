const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const Movie = require('../models/Movie');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { lockSeats, releaseSeats } = require('../services/seatLockService');

/**
 * Generate seat array based on theatre screen layout and prices
 */
const generateSeatsForShow = (theatre, screenName, pricing) => {
  const screen = theatre.screens.find((s) => s.screenName === screenName) || theatre.screens[0];
  const layout = screen.seatLayout || {
    totalRows: 6,
    totalCols: 10,
    tiers: [
      { name: 'vip', rows: ['A', 'B'], defaultPrice: pricing.vip || 400 },
      { name: 'premium', rows: ['C', 'D'], defaultPrice: pricing.premium || 280 },
      { name: 'standard', rows: ['E', 'F'], defaultPrice: pricing.standard || 180 },
    ],
  };

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'].slice(0, layout.totalRows);
  const cols = layout.totalCols;
  const seats = [];

  rows.forEach((rowChar) => {
    // Find tier for this row
    let tier = 'standard';
    let price = pricing.standard || 180;

    for (const t of layout.tiers) {
      if (t.rows.includes(rowChar)) {
        tier = t.name;
        price = pricing[t.name] || t.defaultPrice || 200;
        break;
      }
    }

    for (let c = 1; c <= cols; c++) {
      seats.push({
        seatNumber: `${rowChar}${c}`,
        row: rowChar,
        col: c,
        tier,
        price,
        status: 'available',
        lockedBy: null,
        lockedUntil: null,
      });
    }
  });

  return seats;
};

/**
 * @desc    Get shows for a specific movie, date, and city
 * @route   GET /api/shows/movie/:movieId
 * @access  Public
 */
const getShowsByMovie = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { date, city } = req.query;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return errorResponse(res, 404, 'Movie not found');
    }

    const query = {
      movie: movieId,
      isActive: true,
    };

    if (date) {
      query.showDate = date;
    }

    let shows = await Show.find(query)
      .populate('theatre', 'name location amenities screens')
      .populate('movie', 'title posterUrl duration certificate language')
      .sort('showTime');

    // Filter by city if specified
    if (city && city !== 'All') {
      shows = shows.filter(
        (show) =>
          show.theatre &&
          show.theatre.location &&
          show.theatre.location.city.toLowerCase() === city.toLowerCase()
      );
    }

    // Group shows by Theatre
    const theatreMap = new Map();

    shows.forEach((show) => {
      if (!show.theatre) return;
      const tId = show.theatre._id.toString();

      if (!theatreMap.has(tId)) {
        theatreMap.set(tId, {
          theatre: show.theatre,
          shows: [],
        });
      }

      // Calculate available seats count
      const now = new Date();
      const availableSeats = show.seats.filter(
        (s) =>
          s.status === 'available' ||
          (s.status === 'locked' && s.lockedUntil && new Date(s.lockedUntil) < now)
      ).length;

      theatreMap.get(tId).shows.push({
        _id: show._id,
        screenName: show.screenName,
        showDate: show.showDate,
        showTime: show.showTime,
        pricing: show.pricing,
        totalSeats: show.seats.length,
        availableSeats,
      });
    });

    const grouped = Array.from(theatreMap.values());

    return successResponse(res, 200, 'Shows retrieved successfully', {
      movie,
      theatres: grouped,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get show details by ID (including real-time seat layout)
 * @route   GET /api/shows/:id
 * @access  Public
 */
const getShowById = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movie', 'title posterUrl duration language certificate bannerUrl')
      .populate('theatre', 'name location amenities screens');

    if (!show || !show.isActive) {
      return errorResponse(res, 404, 'Show not found or inactive');
    }

    const now = new Date();
    const currentUserId = req.user ? req.user.id.toString() : null;

    // Sanitize seat state for client view:
    // If a seat lock has expired, mark it as available in memory for response
    const sanitizedSeats = show.seats.map((seat) => {
      let currentStatus = seat.status;
      let isMine = false;

      if (seat.status === 'locked') {
        if (seat.lockedUntil && new Date(seat.lockedUntil) < now) {
          currentStatus = 'available';
        } else if (currentUserId && seat.lockedBy && seat.lockedBy.toString() === currentUserId) {
          isMine = true;
        }
      }

      return {
        seatNumber: seat.seatNumber,
        row: seat.row,
        col: seat.col,
        tier: seat.tier,
        price: seat.price,
        status: currentStatus,
        isMine,
        lockedUntil: seat.lockedUntil,
      };
    });

    return successResponse(res, 200, 'Show details retrieved', {
      _id: show._id,
      movie: show.movie,
      theatre: show.theatre,
      screenName: show.screenName,
      showDate: show.showDate,
      showTime: show.showTime,
      pricing: show.pricing,
      seats: sanitizedSeats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new show schedule
 * @route   POST /api/shows
 * @access  Private/Admin
 */
const createShow = async (req, res, next) => {
  try {
    const { movieId, theatreId, screenName, showDate, showTime, pricing } = req.body;

    if (!movieId || !theatreId || !screenName || !showDate || !showTime) {
      return errorResponse(res, 400, 'Movie, theatre, screen, date, and showtime are required.');
    }

    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      return errorResponse(res, 404, 'Theatre not found.');
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return errorResponse(res, 404, 'Movie not found.');
    }

    // Check for duplicate/overlapping show on same screen at same date and time
    const existing = await Show.findOne({
      theatre: theatreId,
      screenName,
      showDate,
      showTime,
      isActive: true,
    });

    if (existing) {
      return errorResponse(
        res,
        400,
        `Another show is already scheduled in ${screenName} on ${showDate} at ${showTime}.`
      );
    }

    const finalPricing = {
      vip: Number(pricing?.vip || 450),
      premium: Number(pricing?.premium || 300),
      standard: Number(pricing?.standard || 200),
    };

    const seats = generateSeatsForShow(theatre, screenName, finalPricing);

    const show = await Show.create({
      movie: movieId,
      theatre: theatreId,
      screenName,
      showDate,
      showTime,
      pricing: finalPricing,
      seats,
    });

    return successResponse(res, 201, 'Show scheduled successfully', show);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lock seats temporarily for user
 * @route   POST /api/shows/:id/lock
 * @access  Private
 */
const lockSeatsController = async (req, res, next) => {
  try {
    const { seatNumbers } = req.body;
    const showId = req.params.id;

    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return errorResponse(res, 400, 'Please select at least one seat to lock.');
    }

    if (seatNumbers.length > 10) {
      return errorResponse(res, 400, 'Maximum 10 seats can be reserved in a single transaction.');
    }

    const result = await lockSeats(showId, seatNumbers, req.user.id);
    if (!result.success) {
      return errorResponse(res, 409, result.message);
    }

    return successResponse(res, 200, 'Seats locked successfully for 8 minutes.', result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Release temporarily locked seats
 * @route   POST /api/shows/:id/release
 * @access  Private
 */
const releaseSeatsController = async (req, res, next) => {
  try {
    const { seatNumbers } = req.body;
    const showId = req.params.id;

    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return errorResponse(res, 400, 'Please specify seat numbers to release.');
    }

    const result = await releaseSeats(showId, seatNumbers, req.user.id);
    return successResponse(res, 200, 'Seats released successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete show (admin only)
 * @route   DELETE /api/shows/:id
 * @access  Private/Admin
 */
const deleteShow = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      return errorResponse(res, 404, 'Show not found');
    }

    // Check if any seat is booked
    const bookedCount = show.seats.filter((s) => s.status === 'booked').length;
    if (bookedCount > 0) {
      return errorResponse(
        res,
        400,
        `Cannot delete show. ${bookedCount} seats are already booked by customers.`
      );
    }

    await Show.findByIdAndDelete(req.params.id);
    return successResponse(res, 200, 'Show deleted successfully', { id: req.params.id });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all shows for admin table
 * @route   GET /api/shows
 * @access  Private/Admin
 */
const getAllShowsAdmin = async (req, res, next) => {
  try {
    const shows = await Show.find()
      .populate('movie', 'title posterUrl duration')
      .populate('theatre', 'name location.city')
      .sort('-showDate -showTime')
      .limit(100);

    return successResponse(res, 200, 'All shows retrieved', shows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShowsByMovie,
  getShowById,
  createShow,
  lockSeatsController,
  releaseSeatsController,
  deleteShow,
  getAllShowsAdmin,
};

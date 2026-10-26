const crypto = require('crypto');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Payment = require('../models/Payment');
const { createPaymentOrder } = require('../services/paymentService');
const { generateTicketQRCode } = require('../utils/qrCodeService');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { getSocketIO } = require('../services/seatLockService');

/**
 * @desc    Initialize booking checkout and payment order
 * @route   POST /api/bookings/checkout
 * @access  Private
 */
const initiateCheckout = async (req, res, next) => {
  try {
    const { showId, seatNumbers } = req.body;
    const userId = req.user.id;

    if (!showId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return errorResponse(res, 400, 'Show ID and seat numbers are required.');
    }

    const show = await Show.findById(showId)
      .populate('movie', 'title posterUrl duration language certificate')
      .populate('theatre', 'name screenName location');

    if (!show || !show.isActive) {
      return errorResponse(res, 404, 'Show is no longer available.');
    }

    const now = new Date();
    const requestedSet = new Set(seatNumbers);
    const selectedSeats = [];

    // STRICT VALIDATION: Every single seat MUST be locked by this user and lock must not be expired
    for (const seat of show.seats) {
      if (requestedSet.has(seat.seatNumber)) {
        const isMyLock = seat.lockedBy && seat.lockedBy.toString() === userId.toString();
        const notExpired = seat.lockedUntil && new Date(seat.lockedUntil) >= now;

        if (seat.status !== 'locked' || !isMyLock || !notExpired) {
          return errorResponse(
            res,
            409,
            `Seat ${seat.seatNumber} is no longer reserved for you. Please re-select your seats.`
          );
        }

        selectedSeats.push({
          seatNumber: seat.seatNumber,
          tier: seat.tier,
          price: seat.price,
        });
      }
    }

    if (selectedSeats.length !== seatNumbers.length) {
      return errorResponse(res, 400, 'Some requested seats were not found in this show.');
    }

    // SERVER-SIDE CALCULATION: Total calculated strictly on server
    const subtotal = selectedSeats.reduce((acc, curr) => acc + curr.price, 0);
    const convenienceFee = selectedSeats.length * 30; // ₹30 per ticket
    const tax = Math.round(convenienceFee * 0.18); // 18% GST on convenience fee
    const totalAmount = subtotal + convenienceFee + tax;

    // Generate unique human-friendly Booking ID
    const dateStr = show.showDate.replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingId = `IMV-${dateStr}-${randomSuffix}`;
    const verificationToken = crypto.randomBytes(16).toString('hex');

    // Create pending booking
    const booking = await Booking.create({
      bookingId,
      user: userId,
      show: show._id,
      movieDetails: {
        title: show.movie.title,
        posterUrl: show.movie.posterUrl,
        duration: show.movie.duration,
        language: show.movie.language,
        certificate: show.movie.certificate,
      },
      theatreDetails: {
        name: show.theatre.name,
        screenName: show.screenName,
        city: show.theatre.location?.city || '',
        address: show.theatre.location?.address || '',
      },
      showDetails: {
        showDate: show.showDate,
        showTime: show.showTime,
      },
      seats: selectedSeats,
      subtotal,
      convenienceFee,
      tax,
      totalAmount,
      bookingStatus: 'pending',
      paymentStatus: 'unpaid',
      verificationToken,
    });

    // Create payment order
    const paymentOrder = await createPaymentOrder({
      bookingId: booking.bookingId,
      amount: totalAmount,
      currency: 'INR',
      user: req.user,
    });

    return successResponse(res, 201, 'Checkout initiated', {
      booking,
      paymentOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get bookings of logged in user
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .sort('-createdAt')
      .populate('show', 'showDate showTime screenName');

    return successResponse(res, 200, 'User bookings retrieved', bookings);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get booking details by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBookingById = async (req, res, next) => {
  try {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isMongoId
      ? { $or: [{ _id: req.params.id }, { bookingId: req.params.id }] }
      : { bookingId: req.params.id };

    const booking = await Booking.findOne(query).populate('user', 'name email phone');

    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    // Ownership or admin check
    const isOwner = booking.user._id.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 403, 'Unauthorized access to this booking.');
    }

    return successResponse(res, 200, 'Booking retrieved', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel an eligible booking
 * @route   POST /api/bookings/:id/cancel
 * @access  Private
 */
const cancelBooking = async (req, res, next) => {
  try {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isMongoId
      ? { $or: [{ _id: req.params.id }, { bookingId: req.params.id }] }
      : { bookingId: req.params.id };

    const booking = await Booking.findOne(query);

    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    const isOwner = booking.user.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 403, 'Unauthorized to cancel this booking.');
    }

    if (booking.bookingStatus !== 'confirmed') {
      return errorResponse(res, 400, `Cannot cancel booking with status: ${booking.bookingStatus}`);
    }

    // Cancellation cutoff rule: allow cancellation if show is > 2 hours away
    const showDateTime = new Date(`${booking.showDetails.showDate} ${booking.showDetails.showTime}`);
    const now = new Date();
    const hoursDifference = (showDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // If show date is in the past or within 2 hours, reject unless admin
    if (!isAdmin && hoursDifference < 2 && !isNaN(hoursDifference)) {
      return errorResponse(
        res,
        400,
        'Bookings can only be cancelled at least 2 hours before the scheduled showtime.'
      );
    }

    // Release seats on the Show document
    const show = await Show.findById(booking.show);
    const seatNumbers = booking.seats.map((s) => s.seatNumber);

    if (show) {
      const seatSet = new Set(seatNumbers);
      show.seats.forEach((seat) => {
        if (seatSet.has(seat.seatNumber)) {
          seat.status = 'available';
          seat.lockedBy = null;
          seat.lockedUntil = null;
        }
      });
      await show.save();

      // Emit socket notification to all listeners
      const io = getSocketIO();
      if (io) {
        io.to(`show_${show._id}`).emit('seats:updated', {
          showId: show._id,
          action: 'released',
          seats: seatNumbers,
        });
      }
    }

    // Update booking status
    booking.bookingStatus = 'cancelled';
    booking.paymentStatus = 'refunded';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'User requested cancellation';
    await booking.save();

    // Update associated payment record
    if (booking.paymentId) {
      await Payment.findOneAndUpdate(
        { paymentId: booking.paymentId },
        { status: 'refunded' }
      );
    }

    return successResponse(res, 200, 'Booking cancelled and seats released successfully.', booking);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all bookings for admin
 * @route   GET /api/bookings/admin/all
 * @access  Private/Admin
 */
const getAllBookingsAdmin = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.bookingStatus = status;
    }

    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { 'movieDetails.title': { $regex: search, $options: 'i' } },
        { 'theatreDetails.name': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * pageSize;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone')
        .sort('-createdAt')
        .skip(skip)
        .limit(pageSize),
      Booking.countDocuments(query),
    ]);

    return successResponse(res, 200, 'Bookings retrieved', {
      bookings,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / pageSize) || 1,
        limit: pageSize,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiateCheckout,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookingsAdmin,
};

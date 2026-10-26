const Booking = require('../models/Booking');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @desc    Public / Gatekeeper verification of digital ticket
 * @route   GET /api/tickets/verify/:identifier
 * @access  Public
 */
const verifyTicket = async (req, res, next) => {
  try {
    const { identifier } = req.params;

    const booking = await Booking.findOne({
      $or: [
        { bookingId: identifier },
        { verificationToken: identifier },
      ],
    });

    if (!booking) {
      return errorResponse(res, 404, 'Ticket reference not recognized. Invalid or forged ticket.');
    }

    const isValid = booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'completed';

    // Return safe verification payload without exposing private user or payment details
    const safeTicket = {
      bookingId: booking.bookingId,
      status: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      isValid,
      movie: {
        title: booking.movieDetails.title,
        language: booking.movieDetails.language,
        duration: booking.movieDetails.duration,
        certificate: booking.movieDetails.certificate,
        posterUrl: booking.movieDetails.posterUrl,
      },
      theatre: {
        name: booking.theatreDetails.name,
        screenName: booking.theatreDetails.screenName,
        city: booking.theatreDetails.city,
      },
      show: {
        date: booking.showDetails.showDate,
        time: booking.showDetails.showTime,
      },
      seats: booking.seats.map((s) => s.seatNumber),
      seatCount: booking.seats.length,
      bookedAt: booking.createdAt,
    };

    return successResponse(res, 200, 'Ticket verification result', safeTicket);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyTicket,
};

const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { verifyRazorpaySignature } = require('../services/paymentService');
const { confirmSeatsBooking, releaseSeats } = require('../services/seatLockService');
const { generateTicketQRCode } = require('../utils/qrCodeService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @desc    Verify and finalize payment (Razorpay or Mock Gateway)
 * @route   POST /api/payments/verify
 * @access  Private
 */
const verifyPayment = async (req, res, next) => {
  try {
    const {
      bookingId,
      provider = 'mock',
      orderId,
      paymentId,
      signature,
      mockAction = 'success', // 'success' or 'failure'
      paymentMethod = 'mock_upi',
    } = req.body;

    const booking = await Booking.findOne({ bookingId }).populate('show');
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    // Ownership check
    if (booking.user.toString() !== req.user.id.toString()) {
      return errorResponse(res, 403, 'Unauthorized access to this booking.');
    }

    // Prevent duplicate processing
    if (booking.bookingStatus === 'confirmed') {
      return successResponse(res, 200, 'Booking is already confirmed.', booking);
    }

    const seatNumbers = booking.seats.map((s) => s.seatNumber);

    // ==========================================
    // 1. MOCK PAYMENT PROVIDER
    // ==========================================
    if (provider === 'mock') {
      if (mockAction === 'failure') {
        // Release seats atomically back to available
        await releaseSeats(booking.show._id, seatNumbers, req.user.id);

        booking.bookingStatus = 'failed';
        booking.paymentStatus = 'failed';
        await booking.save();

        await Payment.create({
          paymentId: `PAY_FAIL_${Date.now()}`,
          booking: booking._id,
          user: req.user.id,
          amount: booking.totalAmount,
          currency: 'INR',
          provider: 'mock',
          orderId: orderId || `MOCK_${Date.now()}`,
          status: 'failed',
          paymentMethod,
          rawResponse: { error: 'Mock test transaction explicitly declined by user.' },
        });

        return errorResponse(
          res,
          400,
          'Test Payment Declined: Simulated transaction failure. Seats have been released.'
        );
      }

      // Successful Mock Payment:
      const generatedPaymentId = paymentId || `MOCK_PAY_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Confirm seats on show (concurrency check!)
      await confirmSeatsBooking(booking.show._id, seatNumbers, req.user.id);

      // Generate Ticket QR Code
      const qrCodeData = await generateTicketQRCode({
        bookingId: booking.bookingId,
        verificationToken: booking.verificationToken,
        showDate: booking.showDetails.showDate,
        showTime: booking.showDetails.showTime,
        seatNumbers,
      });

      // Update Booking
      booking.bookingStatus = 'confirmed';
      booking.paymentStatus = 'completed';
      booking.paymentId = generatedPaymentId;
      booking.qrCode = qrCodeData;
      await booking.save();

      // Create Payment Record
      await Payment.create({
        paymentId: generatedPaymentId,
        booking: booking._id,
        user: req.user.id,
        amount: booking.totalAmount,
        currency: 'INR',
        provider: 'mock',
        orderId: orderId || `MOCK_ORD_${Date.now()}`,
        status: 'successful',
        paymentMethod,
        rawResponse: { note: 'Mock test payment verified successfully.' },
      });

      return successResponse(res, 200, 'Payment verified and booking confirmed!', booking);
    }

    // ==========================================
    // 2. RAZORPAY PAYMENT PROVIDER
    // ==========================================
    if (provider === 'razorpay') {
      const isValid = verifyRazorpaySignature({
        orderId,
        paymentId,
        signature,
      });

      if (!isValid) {
        // Release seats
        await releaseSeats(booking.show._id, seatNumbers, req.user.id);
        booking.bookingStatus = 'failed';
        booking.paymentStatus = 'failed';
        await booking.save();

        await Payment.create({
          paymentId: paymentId || `FAIL_${Date.now()}`,
          booking: booking._id,
          user: req.user.id,
          amount: booking.totalAmount,
          currency: 'INR',
          provider: 'razorpay',
          orderId,
          signature,
          status: 'failed',
          paymentMethod: 'razorpay_gateway',
          rawResponse: { error: 'Invalid Razorpay signature verification.' },
        });

        return errorResponse(res, 400, 'Payment signature verification failed.');
      }

      // Valid Razorpay transaction:
      await confirmSeatsBooking(booking.show._id, seatNumbers, req.user.id);

      const qrCodeData = await generateTicketQRCode({
        bookingId: booking.bookingId,
        verificationToken: booking.verificationToken,
        showDate: booking.showDetails.showDate,
        showTime: booking.showDetails.showTime,
        seatNumbers,
      });

      booking.bookingStatus = 'confirmed';
      booking.paymentStatus = 'completed';
      booking.paymentId = paymentId;
      booking.qrCode = qrCodeData;
      await booking.save();

      await Payment.create({
        paymentId,
        booking: booking._id,
        user: req.user.id,
        amount: booking.totalAmount,
        currency: 'INR',
        provider: 'razorpay',
        orderId,
        signature,
        status: 'successful',
        paymentMethod: 'razorpay_gateway',
      });

      return successResponse(res, 200, 'Razorpay payment verified and booking confirmed!', booking);
    }

    return errorResponse(res, 400, 'Unsupported payment provider specified.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyPayment,
};

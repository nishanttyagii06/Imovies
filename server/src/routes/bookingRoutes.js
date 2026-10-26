const express = require('express');
const router = express.Router();
const {
  initiateCheckout,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookingsAdmin,
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/checkout', protect, initiateCheckout);
router.get('/my-bookings', protect, getMyBookings);
router.get('/admin/all', protect, adminOnly, getAllBookingsAdmin);
router.get('/:id', protect, getBookingById);
router.post('/:id/cancel', protect, cancelBooking);

module.exports = router;

const mongoose = require('mongoose');

const bookedSeatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true },
  tier: { type: String, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
      index: true,
    },
    movieDetails: {
      title: { type: String, required: true },
      posterUrl: { type: String, default: '' },
      duration: { type: Number, default: 120 },
      language: { type: String, default: 'English' },
      certificate: { type: String, default: 'U/A' },
    },
    theatreDetails: {
      name: { type: String, required: true },
      screenName: { type: String, required: true },
      city: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    showDetails: {
      showDate: { type: String, required: true },
      showTime: { type: String, required: true },
    },
    seats: [bookedSeatSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    convenienceFee: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'expired', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'completed', 'refunded', 'failed'],
      default: 'unpaid',
      index: true,
    },
    paymentId: {
      type: String,
      default: '',
    },
    qrCode: {
      type: String, // Base64 data URL
      default: '',
    },
    verificationToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ user: 1, createdAt: -1 });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
module.exports = Booking;

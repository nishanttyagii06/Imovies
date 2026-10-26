const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  seatNumber: {
    type: String,
    required: true,
  },
  row: {
    type: String,
    required: true,
  },
  col: {
    type: Number,
    required: true,
  },
  tier: {
    type: String,
    enum: ['standard', 'premium', 'vip'],
    default: 'standard',
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'locked', 'booked'],
    default: 'available',
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  lockedUntil: {
    type: Date,
    default: null,
  },
}, { _id: false });

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie reference is required'],
      index: true,
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required'],
      index: true,
    },
    screenName: {
      type: String,
      required: [true, 'Screen name is required'],
    },
    showDate: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Show date is required'],
      index: true,
    },
    showTime: {
      type: String, // Format: "10:30 AM", "02:00 PM", etc.
      required: [true, 'Show time is required'],
    },
    pricing: {
      vip: { type: Number, default: 450 },
      premium: { type: Number, default: 300 },
      standard: { type: Number, default: 200 },
    },
    seats: [seatSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate shows on the same screen at the exact same date & time
showSchema.index(
  { theatre: 1, screenName: 1, showDate: 1, showTime: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

const Show = mongoose.models.Show || mongoose.model('Show', showSchema);
module.exports = Show;

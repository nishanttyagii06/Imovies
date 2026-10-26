const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  screenNumber: {
    type: Number,
    required: true,
  },
  screenName: {
    type: String,
    required: true,
    default: 'Screen 1',
  },
  capacity: {
    type: Number,
    required: true,
    default: 60,
  },
  seatLayout: {
    totalRows: { type: Number, default: 6 },
    totalCols: { type: Number, default: 10 },
    tiers: [
      {
        name: { type: String, enum: ['standard', 'premium', 'vip'], required: true },
        rows: [{ type: String }],
        defaultPrice: { type: Number, default: 250 },
      },
    ],
  },
});

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
      index: true,
    },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true, index: true },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
    },
    contactNumber: {
      type: String,
      default: '',
    },
    amenities: {
      type: [String],
      default: ['Dolby Atmos', '4K Projection', 'Recliner Seats', 'Gourmet Food'],
    },
    screens: [screenSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Theatre = mongoose.models.Theatre || mongoose.model('Theatre', theatreSchema);
module.exports = Theatre;

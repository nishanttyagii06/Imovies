const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating between 1 and 5 is required'],
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per movie
reviewSchema.index({ movie: 1, user: 1 }, { unique: true });

// Static method to recalculate movie rating
reviewSchema.statics.calculateAverageRating = async function (movieId) {
  const stats = await this.aggregate([
    { $match: { movie: new mongoose.Types.ObjectId(movieId), isApproved: true } },
    {
      $group: {
        _id: '$movie',
        avgRating: { $avg: '$rating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const Movie = mongoose.model('Movie');
  if (stats.length > 0) {
    await Movie.findByIdAndUpdate(movieId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      ratingCount: stats[0].ratingCount,
    });
  } else {
    await Movie.findByIdAndUpdate(movieId, {
      rating: 0,
      ratingCount: 0,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.movie);
});

reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) {
    doc.constructor.calculateAverageRating(doc.movie);
  }
});

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
module.exports = Review;

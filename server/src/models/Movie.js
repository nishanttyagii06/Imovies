const mongoose = require('mongoose');

const castSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, default: '' },
  photo: { type: String, default: '' },
}, { _id: false });

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Movie description is required'],
      trim: true,
    },
    genres: {
      type: [String],
      required: [true, 'At least one genre is required'],
      index: true,
    },
    duration: {
      type: Number, // in minutes
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      default: 'English',
      index: true,
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    posterUrl: {
      type: String,
      required: [true, 'Poster image URL is required'],
      default: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
    },
    bannerUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80',
    },
    trailerUrl: {
      type: String,
      default: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    certificate: {
      type: String,
      enum: ['U', 'U/A', 'A', 'PG', 'PG-13', 'R'],
      default: 'U/A',
    },
    status: {
      type: String,
      enum: ['now_showing', 'coming_soon'],
      default: 'now_showing',
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    cast: [castSchema],
    director: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Search indexes (language_override: 'none' avoids conflict with movie.language field)
movieSchema.index(
  { title: 'text', description: 'text', director: 'text' },
  { language_override: 'none' }
);

const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema);
module.exports = Movie;

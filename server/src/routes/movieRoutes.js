const express = require('express');
const router = express.Router();
const {
  getMovies,
  getFeaturedMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} = require('../controllers/movieController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getMovies);
router.get('/featured', getFeaturedMovies);
router.get('/:id', getMovieById);

// Admin-only endpoints
router.post('/', protect, adminOnly, createMovie);
router.put('/:id', protect, adminOnly, updateMovie);
router.delete('/:id', protect, adminOnly, deleteMovie);

module.exports = router;

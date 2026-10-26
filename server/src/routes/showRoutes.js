const express = require('express');
const router = express.Router();
const {
  getShowsByMovie,
  getShowById,
  createShow,
  lockSeatsController,
  releaseSeatsController,
  deleteShow,
  getAllShowsAdmin,
} = require('../controllers/showController');
const { protect, adminOnly, optionalAuth } = require('../middleware/authMiddleware');

router.get('/movie/:movieId', getShowsByMovie);
router.get('/:id', optionalAuth, getShowById);
router.post('/:id/lock', protect, lockSeatsController);
router.post('/:id/release', protect, releaseSeatsController);

// Admin-only endpoints
router.get('/', protect, adminOnly, getAllShowsAdmin);
router.post('/', protect, adminOnly, createShow);
router.delete('/:id', protect, adminOnly, deleteShow);

module.exports = router;

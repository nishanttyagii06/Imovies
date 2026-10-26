const express = require('express');
const router = express.Router();
const {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlistStatus,
} = require('../controllers/watchlistController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getWatchlist);
router.get('/check/:movieId', protect, checkWatchlistStatus);
router.post('/:movieId', protect, addToWatchlist);
router.delete('/:movieId', protect, removeFromWatchlist);

module.exports = router;

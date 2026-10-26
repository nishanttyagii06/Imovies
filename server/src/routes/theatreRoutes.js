const express = require('express');
const router = express.Router();
const {
  getTheatres,
  getCities,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
} = require('../controllers/theatreController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getTheatres);
router.get('/cities', getCities);
router.get('/:id', getTheatreById);

// Admin-only endpoints
router.post('/', protect, adminOnly, createTheatre);
router.put('/:id', protect, adminOnly, updateTheatre);
router.delete('/:id', protect, adminOnly, deleteTheatre);

module.exports = router;

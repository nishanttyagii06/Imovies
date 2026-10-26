const express = require('express');
const router = express.Router();
const { verifyTicket } = require('../controllers/ticketController');

router.get('/verify/:identifier', verifyTicket);

module.exports = router;

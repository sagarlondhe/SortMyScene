const express = require('express');
const reservationController = require('../controllers/reservationController');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/authMiddleware');
const { validateReservation } = require('../middleware/validationMiddleware');

const router = express.Router();

router.post('/', protect, validateReservation, asyncHandler(reservationController.reserveSeats));

module.exports = router;

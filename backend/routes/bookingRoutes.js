const express = require('express');
const bookingController = require('../controllers/bookingController');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/authMiddleware');
const { validateBooking } = require('../middleware/validationMiddleware');

const router = express.Router();

router.post('/', protect, validateBooking, asyncHandler(bookingController.confirmBooking));
router.get('/my', protect, asyncHandler(bookingController.getMyBookings));

module.exports = router;

const express = require('express');
const eventController = require('../controllers/eventController');
const asyncHandler = require('../utils/asyncHandler');
const { validateEventId } = require('../middleware/validationMiddleware');

const router = express.Router();

router.get('/', asyncHandler(eventController.getAllEvents));
router.get('/:id', validateEventId, asyncHandler(eventController.getEventById));

module.exports = router;

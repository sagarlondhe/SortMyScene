const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const seatPattern = /^[A-Z]{1,2}\d{1,3}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const validate = (validator) => (req, res, next) => {
  try {
    validator(req);
    next();
  } catch (error) {
    next(error);
  }
};

const assertObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
};

const validateEventId = validate((req) => {
  assertObjectId(req.params.id, 'event ID');
});

const validateRegister = validate((req) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    throw new ApiError(400, 'Username, email, and password are required');
  }

  if (!usernamePattern.test(username)) {
    throw new ApiError(400, 'Username must be 3-30 characters and contain only letters, numbers, and underscores');
  }

  if (!emailPattern.test(email)) {
    throw new ApiError(400, 'Invalid email format');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  if (!passwordPattern.test(password)) {
    throw new ApiError(400, 'Password must contain uppercase, lowercase, number, and special character');
  }
});

const validateLogin = validate((req) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }
});

const validateReservation = validate((req) => {
  const { eventId, seatNumbers } = req.body || {};

  assertObjectId(eventId, 'event ID');

  if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    throw new ApiError(400, 'Seat numbers array is required');
  }

  if (seatNumbers.length > 20) {
    throw new ApiError(400, 'Cannot reserve more than 20 seats at once');
  }

  const invalidSeats = seatNumbers.filter(
    (seat) => typeof seat !== 'string' || !seatPattern.test(seat.trim().toUpperCase())
  );

  if (invalidSeats.length > 0) {
    throw new ApiError(400, `Invalid seat numbers: ${invalidSeats.join(', ')}`);
  }
});

const validateBooking = validate((req) => {
  const { reservationId } = req.body || {};
  assertObjectId(reservationId, 'reservation ID');
});

module.exports = {
  validateEventId,
  validateRegister,
  validateLogin,
  validateReservation,
  validateBooking,
};

const bookingService = require('../services/bookingService');

const confirmBooking = async (req, res) => {
  const result = await bookingService.confirmBooking(req.user.userId, req.body);
  res.status(201).json({ success: true, data: result });
};

const getMyBookings = async (req, res) => {
  const bookings = await bookingService.getUserBookings(req.user.userId);
  res.status(200).json({ success: true, data: bookings });
};

module.exports = { confirmBooking, getMyBookings };

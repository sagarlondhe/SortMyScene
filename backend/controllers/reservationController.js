const reservationService = require('../services/reservationService');

const reserveSeats = async (req, res) => {
  const result = await reservationService.reserveSeats(req.user.userId, req.body);
  res.status(201).json({ success: true, data: result });
};

module.exports = { reserveSeats };

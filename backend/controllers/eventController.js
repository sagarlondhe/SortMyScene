const eventService = require('../services/eventService');

const getAllEvents = async (req, res) => {
  const events = await eventService.getAllEvents();
  res.status(200).json({ success: true, data: events });
};

const getEventById = async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  res.status(200).json({ success: true, data: event });
};

module.exports = { getAllEvents, getEventById };

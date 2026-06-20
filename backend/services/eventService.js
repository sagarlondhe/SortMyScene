const EventRepository = require('../repositories/eventRepository');
const SeatRepository = require('../repositories/seatRepository');
const ApiError = require('../utils/ApiError');

const eventRepository = new EventRepository();
const seatRepository = new SeatRepository();

const sortSeatsNaturally = (seats) => {
  const parseSeat = (seatNumber) => {
    const match = seatNumber.match(/^([A-Z]+)(\d+)$/);
    if (!match) return { row: seatNumber, num: 0 };
    return { row: match[1], num: parseInt(match[2], 10) };
  };

  return [...seats].sort((a, b) => {
    const seatA = parseSeat(a.seat_number);
    const seatB = parseSeat(b.seat_number);
    if (seatA.row !== seatB.row) return seatA.row.localeCompare(seatB.row);
    return seatA.num - seatB.num;
  });
};

class EventService {
  /**
   * Get all events with seat availability
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async getAllEvents(filters = {}, options = {}) {
    try {
      const events = await eventRepository.findAll(filters, options);

      const eventsWithAvailability = await Promise.all(
        events.map(async (event) => {
          const seatStats = await seatRepository.getSeatStats(event._id);
          return {
            id: event._id,
            name: event.name,
            venue: event.venue,
            date: event.event_date,
            totalSeats: event.total_seats,
            availableSeats: seatStats.available,
            bookedSeats: seatStats.booked,
            reservedSeats: seatStats.reserved,
            image: event.image || null,
          };
        })
      );

      return eventsWithAvailability;
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch events');
    }
  }

  /**
   * Get event by ID with detailed seat information
   * @param {String} eventId - Event ID
   * @returns {Promise<Object>}
   */
  async getEventById(eventId) {
    try {
      const event = await eventRepository.findById(eventId);
      if (!event) {
        throw new ApiError(404, 'Event not found');
      }

      const seats = sortSeatsNaturally(await seatRepository.findByEventId(eventId));
      const seatStats = await seatRepository.getSeatStats(eventId);

      return {
        id: event._id,
        name: event.name,
        venue: event.venue,
        date: event.event_date,
        totalSeats: event.total_seats,
        availableSeats: seatStats.available,
        bookedSeats: seatStats.booked,
        reservedSeats: seatStats.reserved,
        image: event.image || null,
        description: event.description || null,
        seats: seats.map((seat) => ({
          id: seat._id,
          seatNumber: seat.seat_number,
          status: seat.status,
          row: seat.row,
          seatIndex: seat.seat_index,
          reservedBy: seat.reserved_by,
          reservationExpiry: seat.reservation_expiry,
        })),
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch event');
    }
  }

  /**
   * Search events by text
   * @param {String} searchTerm - Search term
   * @returns {Promise<Array>}
   */
  async searchEvents(searchTerm) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new ApiError(400, 'Search term must be at least 2 characters');
    }

    try {
      const events = await eventRepository.search(searchTerm.trim());

      const eventsWithAvailability = await Promise.all(
        events.map(async (event) => {
          const seatStats = await seatRepository.getSeatStats(event._id);
          return {
            id: event._id,
            name: event.name,
            venue: event.venue,
            date: event.event_date,
            totalSeats: event.total_seats,
            availableSeats: seatStats.available,
            image: event.image || null,
          };
        })
      );

      return eventsWithAvailability;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to search events');
    }
  }
}

module.exports = new EventService();

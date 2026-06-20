const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');

class BookingRepository {
  /**
   * Create new booking
   * @param {Object} bookingData - Booking data
   * @returns {Promise<Object>}
   */
  async create(bookingData, session = null) {
    try {
      if (session) {
        const [booking] = await Booking.create([bookingData], { session });
        return booking;
      }
      return await Booking.create(bookingData);
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError(409, 'Duplicate booking reference');
      }
      throw new ApiError(500, 'Failed to create booking');
    }
  }

  async createBooking(bookingData, session = null) {
    return this.create(bookingData, session);
  }

  /**
   * Find booking by ID
   * @param {String} id - Booking ID
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid booking ID');
      }
      return Booking.findById(id)
        .populate('event_id', 'name venue event_date price_per_seat')
        .populate('reservation_id', 'seat_numbers expires_at')
        .lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch booking');
    }
  }

  /**
   * Find booking by reference
   * @param {String} reference - Booking reference
   * @returns {Promise<Object|null>}
   */
  async findByReference(reference) {
    try {
      return Booking.findOne({ booking_reference: reference })
        .populate('event_id', 'name venue event_date price_per_seat')
        .populate('reservation_id', 'seat_numbers expires_at')
        .lean();
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch booking');
    }
  }

  /**
   * Find user's bookings
   * @param {String} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByUserId(userId, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, 'Invalid user ID');
      }
      const { limit = 20, skip = 0, status } = options;
      
      const query = { user_id: userId };
      if (status) query.status = status;

      return Booking.find(query)
        .populate('event_id', 'name venue event_date price_per_seat')
        .sort({ booking_time: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch bookings');
    }
  }

  /**
   * Find bookings by event
   * @param {String} eventId - Event ID
   * @returns {Promise<Array>}
   */
  async findByEventId(eventId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, 'Invalid event ID');
      }
      return Booking.find({ event_id: eventId })
        .populate('user_id', 'username email')
        .sort({ booking_time: -1 })
        .lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch bookings');
    }
  }

  /**
   * Update booking status
   * @param {String} id - Booking ID
   * @param {String} status - New status
   * @returns {Promise<Object|null>}
   */
  async updateStatus(id, status) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid booking ID');
      }
      return Booking.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
      ).lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update booking');
    }
  }

  /**
   * Cancel booking
   * @param {String} id - Booking ID
   * @param {String} userId - User ID (for authorization)
   * @returns {Promise<Object|null>}
   */
  async cancel(id, userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid booking ID');
      }
      return Booking.findOneAndUpdate(
        {
          _id: id,
          user_id: userId,
          status: 'confirmed',
        },
        { status: 'cancelled' },
        { new: true }
      ).lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to cancel booking');
    }
  }

  /**
   * Get booking statistics
   * @param {String} eventId - Event ID (optional)
   * @returns {Promise<Object>}
   */
  async getStats(eventId = null) {
    try {
      const match = eventId ? { event_id: new mongoose.Types.ObjectId(eventId) } : {};
      
      const stats = await Booking.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$total_amount' }
          }
        }
      ]);

      const result = {
        total: 0,
        confirmed: 0,
        cancelled: 0,
        refunded: 0,
        totalRevenue: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
        result.totalRevenue += stat.totalRevenue;
      });

      return result;
    } catch (error) {
      throw new ApiError(500, 'Failed to get booking statistics');
    }
  }
}

module.exports = BookingRepository;

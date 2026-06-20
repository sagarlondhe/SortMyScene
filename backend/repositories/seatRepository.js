const mongoose = require('mongoose');
const Seat = require('../models/Seat');
const ApiError = require('../utils/ApiError');

class SeatRepository {
  /**
   * Find seats by event ID with sorting
   * @param {String} eventId - Event ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>}
   */
  async findByEventId(eventId, filters = {}, session = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, 'Invalid event ID');
      }
      return Seat.find({ event_id: eventId, ...filters })
        .sort({ row: 1, seat_index: 1 })
        .session(session)
        .lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch seats');
    }
  }

  /**
   * Find seats by event and seat numbers
   * @param {String} eventId - Event ID
   * @param {Array} seatNumbers - Array of seat numbers
   * @returns {Promise<Array>}
   */
  async findByEventAndSeatNumbers(eventId, seatNumbers, session = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, 'Invalid event ID');
      }
      return Seat.find({
        event_id: eventId,
        seat_number: { $in: seatNumbers },
      })
        .session(session)
        .lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch seats');
    }
  }

  /**
   * Count available seats for an event
   * @param {String} eventId - Event ID
   * @returns {Promise<Number>}
   */
  async countAvailableByEventId(eventId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, 'Invalid event ID');
      }
      return Seat.countDocuments({ 
        event_id: eventId, 
        status: 'available' 
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to count seats');
    }
  }

  /**
   * Create multiple seats
   * @param {Array} seats - Array of seat objects
   * @returns {Promise<Array>}
   */
  async createMany(seats) {
    try {
      return await Seat.insertMany(seats, { ordered: false });
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError(409, 'Duplicate seat numbers detected');
      }
      throw new ApiError(500, 'Failed to create seats');
    }
  }

  /**
   * ATOMIC: Reserve a single seat with race condition protection
   * Uses findOneAndUpdate with query condition to ensure atomicity
   * @param {String} seatId - Seat ID
   * @param {String} userId - User ID
   * @param {Date} expiry - Reservation expiry time
   * @returns {Promise<Object|null>} Returns updated seat or null if unavailable
   */
  async reserveSeatAtomic(seatId, userId, expiry) {
    try {
      if (!mongoose.Types.ObjectId.isValid(seatId)) {
        throw new ApiError(400, 'Invalid seat ID');
      }
      
      // Atomic operation: only updates if status is 'available'
      const seat = await Seat.findOneAndUpdate(
        { 
          _id: seatId, 
          $or: [
            { status: 'available' },
            { status: 'reserved', reservation_expiry: { $lte: new Date() } },
          ],
        },
        {
          status: 'reserved',
          reserved_by: userId,
          reservation_expiry: expiry,
          booking_id: null,
        },
        { 
          new: true,
          runValidators: true
        }
      ).lean();

      return seat; // Returns null if seat was not available
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to reserve seat');
    }
  }

  /**
   * ATOMIC: Reserve multiple seats in a single transaction-like operation
   * Uses bulkWrite with ordered: false for performance
   * @param {Array} seatIds - Array of seat IDs
   * @param {String} userId - User ID
   * @param {Date} expiry - Reservation expiry time
   * @returns {Promise<Object>} Returns success count and failed seats
   */
  async reserveSeatsAtomic(seatIds, userId, expiry, session = null) {
    try {
      const operations = seatIds.map(seatId => ({
        updateOne: {
          filter: { 
            _id: seatId, 
            status: 'available',
          },
          update: {
            status: 'reserved',
            reserved_by: userId,
            reservation_expiry: expiry,
          },
        }
      }));

      const result = await Seat.bulkWrite(operations, { ordered: false, session });
      
      return {
        successCount: result.modifiedCount,
        failedCount: seatIds.length - result.modifiedCount,
        succeeded: true
      };
    } catch (error) {
      throw new ApiError(500, 'Failed to reserve seats');
    }
  }

  /**
   * ATOMIC: Reserve requested seats for an event by seat number.
   * Matches truly available seats and stale expired reservations in one write.
   */
  async reserveSeatsForReservation(eventId, seatNumbers, userId, expiry, session = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, 'Invalid event ID');
      }

      const now = new Date();
      const result = await Seat.updateMany(
        {
          event_id: eventId,
          seat_number: { $in: seatNumbers },
          $or: [
            { status: 'available' },
            { status: 'reserved', reservation_expiry: { $lte: now } },
          ],
        },
        {
          status: 'reserved',
          reserved_by: userId,
          reservation_expiry: expiry,
          booking_id: null,
        },
        { session, runValidators: true }
      );

      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to reserve seats');
    }
  }

  /**
   * Release seats back to available
   * @param {Array} seatIds - Array of seat IDs
   * @returns {Promise<Object>}
   */
  async releaseSeats(seatIds, session = null) {
    try {
      const result = await Seat.updateMany(
        { _id: { $in: seatIds }, status: 'reserved' },
        {
          status: 'available',
          reserved_by: null,
          reservation_expiry: null,
          booking_id: null,
        },
        { session }
      );
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      throw new ApiError(500, 'Failed to release seats');
    }
  }

  /**
   * Rollback helper: release seats by event + seat numbers + userId.
   * Used when a partial reservation needs to be undone.
   * @param {String} eventId - Event ID
   * @param {Array} seatNumbers - Seat numbers to release
   * @param {String} userId - Only release seats reserved by this user
   * @returns {Promise<Object>}
   */
  async releaseSeatsForUser(eventId, seatNumbers, userId) {
    try {
      const result = await Seat.updateMany(
        {
          event_id:    eventId,
          seat_number: { $in: seatNumbers },
          reserved_by: userId,
          status:      'reserved',
        },
        {
          status:             'available',
          reserved_by:        null,
          reservation_expiry: null,
          booking_id:         null,
        }
      );
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      throw new ApiError(500, 'Failed to release seats for user');
    }
  }

  /**
   * ATOMIC: Book reserved seats for user
   * Only converts seats that are reserved by this specific user
   * @param {Array} seatIds - Array of seat IDs
   * @param {String} userId - User ID
   * @param {String} bookingId - Booking ID
   * @returns {Promise<Object>}
   */
  async bookSeatsForUser(seatIds, userId, bookingId, session = null) {
    try {
      const result = await Seat.updateMany(
        { 
          _id: { $in: seatIds }, 
          status: 'reserved', 
          reserved_by: userId,
          reservation_expiry: { $gt: new Date() } // Must not be expired
        },
        {
          status: 'booked',
          reservation_expiry: null,
          booking_id: bookingId,
        },
        { session, runValidators: true }
      );
      return { 
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount 
      };
    } catch (error) {
      throw new ApiError(500, 'Failed to book seats');
    }
  }

  async bookReservedSeats(seatIds, userId, bookingId, session = null) {
    return this.bookSeatsForUser(seatIds, userId, bookingId, session);
  }

  /**
   * Revert booked seats back to reserved (for rollback)
   * @param {Array} seatIds - Array of seat IDs
   * @param {String} userId - User ID
   * @param {Date} expiry - New expiry time
   * @returns {Promise<Object>}
   */
  async revertBookedToReserved(seatIds, userId, expiry) {
    try {
      const result = await Seat.updateMany(
        { _id: { $in: seatIds }, status: 'booked', reserved_by: userId },
        {
          status: 'reserved',
          reservation_expiry: expiry,
          booking_id: null,
        }
      );
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      throw new ApiError(500, 'Failed to revert seats');
    }
  }

  /**
   * Find expired reserved seats
   * @param {Date} now - Current date
   * @returns {Promise<Array>}
   */
  async findExpiredReservedSeats(now = new Date()) {
    try {
      return Seat.find({
        status: 'reserved',
        reservation_expiry: { $lte: now },
      }).lean();
    } catch (error) {
      throw new ApiError(500, 'Failed to find expired seats');
    }
  }

  /**
   * Release all expired reservations
   * @param {Date} now - Current date
   * @returns {Promise<Object>}
   */
  async releaseExpiredSeats(now = new Date(), session = null) {
    try {
      const result = await Seat.updateMany(
        {
          status: 'reserved',
          reservation_expiry: { $lte: now },
        },
        {
          status: 'available',
          reserved_by: null,
          reservation_expiry: null,
          booking_id: null,
        },
        { session }
      );
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      throw new ApiError(500, 'Failed to release expired seats');
    }
  }

  async releaseExpiredSeatsByIds(seatIds, now = new Date(), session = null) {
    try {
      const result = await Seat.updateMany(
        {
          _id: { $in: seatIds },
          status: 'reserved',
          reservation_expiry: { $lte: now },
        },
        {
          status: 'available',
          reserved_by: null,
          reservation_expiry: null,
          booking_id: null,
        },
        { session }
      );
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      throw new ApiError(500, 'Failed to release expired seats');
    }
  }

  /**
   * Get seat statistics for an event
   * @param {String} eventId - Event ID
   * @returns {Promise<Object>}
   */
  async getSeatStats(eventId) {
    try {
      const stats = await Seat.aggregate([
        { $match: { event_id: new mongoose.Types.ObjectId(eventId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        total: 0,
        available: 0,
        reserved: 0,
        booked: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
      });

      return result;
    } catch (error) {
      throw new ApiError(500, 'Failed to get seat statistics');
    }
  }

  /**
   * Extend reservation expiry for seats
   * @param {Array} seatIds - Array of seat IDs
   * @param {Date} newExpiry - New expiry time
   * @returns {Promise<Object>}
   */
  async extendSeatsExpiry(seatIds, newExpiry) {
    try {
      const result = await Seat.updateMany(
        { 
          _id: { $in: seatIds }, 
          status: 'reserved',
          reservation_expiry: { $gt: new Date() }
        },
        {
          reservation_expiry: newExpiry,
        }
      );
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      throw new ApiError(500, 'Failed to extend seat reservation');
    }
  }
}

module.exports = SeatRepository;

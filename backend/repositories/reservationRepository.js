const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const ApiError = require('../utils/ApiError');

class ReservationRepository {
  /**
   * Create new reservation
   * @param {Object} reservationData - Reservation data
   * @returns {Promise<Object>}
   */
  async create(reservationData, session = null) {
    try {
      if (session) {
        const [reservation] = await Reservation.create([reservationData], { session });
        return reservation;
      }
      return await Reservation.create(reservationData);
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError(409, 'Duplicate reservation');
      }
      throw new ApiError(500, 'Failed to create reservation');
    }
  }

  /**
   * Find reservation by ID
   * @param {String} id - Reservation ID
   * @returns {Promise<Object|null>}
   */
  async findById(id, session = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid reservation ID');
      }
      return Reservation.findById(id).session(session).lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch reservation');
    }
  }

  /**
   * Find active reservation by ID
   * @param {String} id - Reservation ID
   * @returns {Promise<Object|null>}
   */
  async findActiveById(id, session = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid reservation ID');
      }
      return Reservation.findOne({ 
        _id: id, 
        status: 'active',
        expires_at: { $gt: new Date() }
      }).session(session).lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch reservation');
    }
  }

  /**
   * ATOMIC: Mark reservation as completed if active and owned by user
   * @param {String} id - Reservation ID
   * @param {String} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async markCompletedIfActive(id, userId, bookingId = null, session = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid reservation ID');
      }
      return Reservation.findOneAndUpdate(
        {
          _id: id,
          user_id: userId,
          status: 'active',
          expires_at: { $gt: new Date() },
        },
        { status: 'completed', booking_id: bookingId },
        { new: true, session }
      ).lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update reservation');
    }
  }

  /**
   * Mark reservation as active
   * @param {String} id - Reservation ID
   * @returns {Promise<Object|null>}
   */
  async markActive(id, session = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid reservation ID');
      }
      return Reservation.findByIdAndUpdate(
        id, 
        { status: 'active', booking_id: null }, 
        { new: true, session }
      ).lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update reservation');
    }
  }

  /**
   * Mark multiple reservations as expired
   * @param {Array} ids - Array of reservation IDs
   * @returns {Promise<Object>}
   */
  async markExpired(ids, session = null) {
    try {
      const result = await Reservation.updateMany(
        { _id: { $in: ids }, status: 'active' },
        { status: 'expired' },
        { session }
      );
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      throw new ApiError(500, 'Failed to expire reservations');
    }
  }

  async completeReservation(id, userId, bookingId, session = null) {
    return this.markCompletedIfActive(id, userId, bookingId, session);
  }

  async update(id, updateData, session = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid reservation ID');
      }
      return Reservation.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true, session }
      ).lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update reservation');
    }
  }

  async expireReservations(ids, session = null) {
    return this.markExpired(ids, session);
  }

  /**
   * Find all expired active reservations
   * @param {Date} now - Current date
   * @returns {Promise<Array>}
   */
  async findExpiredActive(now = new Date()) {
    try {
      return Reservation.find({
        status: 'active',
        expires_at: { $lte: now },
      }).lean();
    } catch (error) {
      throw new ApiError(500, 'Failed to find expired reservations');
    }
  }

  /**
   * Find user's active reservations
   * @param {String} userId - User ID
   * @returns {Promise<Array>}
   */
  async findActiveByUserId(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, 'Invalid user ID');
      }
      return Reservation.find({
        user_id: userId,
        status: 'active',
        expires_at: { $gt: new Date() }
      })
      .sort({ expires_at: 1 })
      .lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch reservations');
    }
  }

  /**
   * Find user's reservation history
   * @param {String} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByUserId(userId, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, 'Invalid user ID');
      }
      const { limit = 20, skip = 0 } = options;
      return Reservation.find({ user_id: userId })
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch reservations');
    }
  }

  /**
   * Cancel reservation
   * @param {String} id - Reservation ID
   * @param {String} userId - User ID (for authorization)
   * @returns {Promise<Object|null>}
   */
  async cancel(id, userId, session = null) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid reservation ID');
      }
      return Reservation.findOneAndUpdate(
        {
          _id: id,
          user_id: userId,
          status: 'active',
        },
        { status: 'cancelled' },
        { new: true, session }
      ).lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to cancel reservation');
    }
  }
}

module.exports = ReservationRepository;

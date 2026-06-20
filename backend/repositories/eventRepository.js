const mongoose = require('mongoose');
const Event = require('../models/Event');
const ApiError = require('../utils/ApiError');

class EventRepository {
  /**
   * Find all active events
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options (sort, limit, skip)
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}, options = {}) {
    try {
      const { sort = { event_date: 1 }, limit = 100, skip = 0 } = options;
      return Event.find(filters)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean();
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch events');
    }
  }

  /**
   * Find event by ID
   * @param {String} id - Event ID
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid event ID');
      }
      return Event.findById(id).lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch event');
    }
  }

  /**
   * Create new event
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>}
   */
  async create(eventData) {
    try {
      return await Event.create(eventData);
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError(409, 'Event with this name already exists');
      }
      throw new ApiError(500, 'Failed to create event');
    }
  }

  /**
   * Update event
   * @param {String} id - Event ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>}
   */
  async update(id, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid event ID');
      }
      return Event.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update event');
    }
  }

  /**
   * Soft delete event
   * @param {String} id - Event ID
   * @returns {Promise<Object|null>}
   */
  async softDelete(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid event ID');
      }
      return Event.findByIdAndUpdate(
        id,
        { is_deleted: true },
        { new: true }
      ).lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to delete event');
    }
  }

  /**
   * Search events by text
   * @param {String} searchTerm - Search term
   * @returns {Promise<Array>}
   */
  async search(searchTerm) {
    try {
      return Event.find(
        { $text: { $search: searchTerm } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(20)
        .lean();
    } catch (error) {
      throw new ApiError(500, 'Failed to search events');
    }
  }
}

module.exports = EventRepository;

const mongoose = require('mongoose');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

class UserRepository {
  /**
   * Find user by email
   * @param {String} email - User email
   * @param {Boolean} includePassword - Include password field
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email, includePassword = false) {
    try {
      const query = User.findOne({ email: email.toLowerCase() });
      if (includePassword) {
        query.select('+password');
      }
      return await query.lean();
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch user');
    }
  }

  /**
   * Find user by username
   * @param {String} username - Username
   * @param {Boolean} includePassword - Include password field
   * @returns {Promise<Object|null>}
   */
  async findByUsername(username, includePassword = false) {
    try {
      const query = User.findOne({ username });
      if (includePassword) {
        query.select('+password');
      }
      return await query.lean();
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch user');
    }
  }

  /**
   * Find user by ID
   * @param {String} id - User ID
   * @param {Boolean} includePassword - Include password field
   * @returns {Promise<Object|null>}
   */
  async findById(id, includePassword = false) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid user ID');
      }
      const query = User.findById(id);
      if (includePassword) {
        query.select('+password');
        return await query;
      }
      return await query.lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch user');
    }
  }

  /**
   * Find user by email or username (for login)
   * @param {String} identifier - Email or username
   * @returns {Promise<Object|null>}
   */
  async findByEmailOrUsername(identifier) {
    try {
      return await User.findByEmailOrUsername(identifier);
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch user');
    }
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>}
   */
  async create(userData) {
    try {
      return await User.create(userData);
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ApiError(409, `User with this ${field} already exists`);
      }
      throw new ApiError(500, 'Failed to create user');
    }
  }

  /**
   * Update user
   * @param {String} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>}
   */
  async update(id, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid user ID');
      }
      // Don't allow password update through this method
      if (updateData.password) {
        delete updateData.password;
      }
      return User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password').lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error.code === 11000) {
        throw new ApiError(409, 'User with this email or username already exists');
      }
      throw new ApiError(500, 'Failed to update user');
    }
  }

  /**
   * Update user password
   * @param {String} id - User ID
   * @param {String} newPassword - New password
   * @returns {Promise<Object|null>}
   */
  async updatePassword(id, newPassword) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid user ID');
      }
      const user = await User.findById(id);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
      user.password = newPassword;
      await user.save();
      return user;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update password');
    }
  }

  /**
   * Deactivate user account
   * @param {String} id - User ID
   * @returns {Promise<Object|null>}
   */
  async deactivate(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid user ID');
      }
      return User.findByIdAndUpdate(
        id,
        { is_active: false },
        { new: true }
      ).select('-password').lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to deactivate user');
    }
  }

  /**
   * Add refresh token to user
   * @param {String} id - User ID
   * @param {String} token - Refresh token
   * @param {Date} expiresAt - Token expiry
   * @returns {Promise<Object|null>}
   */
  async addRefreshToken(id, token, expiresAt) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid user ID');
      }
      return User.findByIdAndUpdate(
        id,
        {
          $push: {
            refresh_tokens: {
              token,
              expires_at: expiresAt,
              created_at: new Date()
            }
          }
        },
        { new: true }
      ).select('-password').lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to add refresh token');
    }
  }

  /**
   * Remove refresh token from user
   * @param {String} id - User ID
   * @param {String} token - Refresh token to remove
   * @returns {Promise<Object|null>}
   */
  async removeRefreshToken(id, token) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid user ID');
      }
      return User.findByIdAndUpdate(
        id,
        {
          $pull: {
            refresh_tokens: { token }
          }
        },
        { new: true }
      ).select('-password').lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to remove refresh token');
    }
  }

  /**
   * Clear all refresh tokens for user
   * @param {String} id - User ID
   * @returns {Promise<Object|null>}
   */
  async clearRefreshTokens(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid user ID');
      }
      return User.findByIdAndUpdate(
        id,
        { refresh_tokens: [] },
        { new: true }
      ).select('-password').lean();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to clear refresh tokens');
    }
  }
}

module.exports = UserRepository;

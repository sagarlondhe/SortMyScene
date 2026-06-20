const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/userRepository');
const generateToken = require('../utils/generateToken');
const generateRefreshToken = require('../utils/generateRefreshToken');
const ApiError = require('../utils/ApiError');

const userRepository = new UserRepository();
const REFRESH_TOKEN_HASH_ROUNDS = 12;

const hashRefreshToken = (token) => bcrypt.hash(token, REFRESH_TOKEN_HASH_ROUNDS);

const verifyRefreshTokenHash = async (token, storedTokens = []) => {
  for (const storedToken of storedTokens) {
    if (storedToken.expires_at <= new Date()) continue;
    if (await bcrypt.compare(token, storedToken.token)) {
      return true;
    }
  }
  return false;
};

class AuthService {
  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>}
   */
  async register({ username, email, password }) {
    // Input validation
    if (!username || !email || !password) {
      throw new ApiError(400, 'Username, email, and password are required');
    }

    if (username.length < 3 || username.length > 30) {
      throw new ApiError(400, 'Username must be between 3 and 30 characters');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, 'Invalid email format');
    }

    if (password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters');
    }

    // Check for existing user
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      throw new ApiError(409, 'Email already registered');
    }

    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      throw new ApiError(409, 'Username already taken');
    }

    // Create user (password hashing is handled by User model pre-save hook)
    const user = await userRepository.create({
      username,
      email: email.toLowerCase(),
      password, // Will be hashed by model hook
    });

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    // Store refresh token
    await userRepository.addRefreshToken(
      user._id,
      refreshTokenHash,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    );

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
      },
      token,
      refreshToken,
    };
  }

  /**
   * Login user with account lockout protection
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>}
   */
  async login({ email, password }) {
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    // Find user (include password for comparison)
    const user = await userRepository.findByEmailOrUsername(email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Check if account is locked
    if (user.is_locked) {
      throw new ApiError(423, 'Account is temporarily locked due to multiple failed attempts. Please try again later.');
    }

    // Check if account is active
    if (!user.is_active) {
      throw new ApiError(403, 'Account is deactivated');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment failed login attempts
      await user.incrementFailedLogin();
      throw new ApiError(401, 'Invalid email or password');
    }

    // Reset failed login attempts on successful login
    await user.resetFailedLogin();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const refreshTokenHash = await hashRefreshToken(refreshToken);

    // Store refresh token
    await userRepository.addRefreshToken(
      user._id,
      refreshTokenHash,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    );

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
      },
      token,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   * @param {String} refreshToken - Refresh token
   * @returns {Promise<Object>}
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }

    let decoded;

    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.is_active) {
      throw new ApiError(403, 'Account is deactivated');
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = await verifyRefreshTokenHash(refreshToken, user.refresh_tokens);

    if (!tokenExists) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Generate new access token
    const newToken = generateToken(user._id);

    return {
      token: newToken,
    };
  }

  /**
   * Logout user (invalidate refresh token)
   * @param {String} userId - User ID
   * @param {String} refreshToken - Refresh token to invalidate
   * @returns {Promise<Object>}
   */
  async logout(userId, refreshToken) {
    if (!userId) {
      throw new ApiError(400, 'User ID is required');
    }

    if (refreshToken) {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      let matchingToken = null;
      for (const storedToken of user.refresh_tokens || []) {
        if (storedToken.expires_at > new Date() && await bcrypt.compare(refreshToken, storedToken.token)) {
          matchingToken = storedToken;
          break;
        }
      }

      if (matchingToken) {
        await userRepository.removeRefreshToken(userId, matchingToken.token);
      }
    } else {
      // Clear all tokens if no specific token provided
      await userRepository.clearRefreshTokens(userId);
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices
   * @param {String} userId - User ID
   * @returns {Promise<Object>}
   */
  async logoutAll(userId) {
    if (!userId) {
      throw new ApiError(400, 'User ID is required');
    }

    await userRepository.clearRefreshTokens(userId);

    return { message: 'Logged out from all devices successfully' };
  }

  /**
   * Change user password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @returns {Promise<Object>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    if (!userId || !currentPassword || !newPassword) {
      throw new ApiError(400, 'User ID, current password, and new password are required');
    }

    if (newPassword.length < 8) {
      throw new ApiError(400, 'New password must be at least 8 characters');
    }

    const user = await userRepository.findById(userId, true);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    await userRepository.updatePassword(userId, newPassword);

    // Clear all refresh tokens (force re-login)
    await userRepository.clearRefreshTokens(userId);

    return { message: 'Password changed successfully' };
  }
}

module.exports = new AuthService();

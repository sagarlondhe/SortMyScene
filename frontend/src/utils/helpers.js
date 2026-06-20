/**
 * Utility Functions - Formatting, validation, and helper functions
 */

/**
 * Format date to readable format
 */
export const formatDate = (dateStr, options = {}) => {
  const defaultOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  try {
    return new Date(dateStr).toLocaleDateString('en-IN', defaultOptions);
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format time to readable format
 */
export const formatTime = (dateStr, options = {}) => {
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };

  try {
    return new Date(dateStr).toLocaleTimeString('en-IN', defaultOptions);
  } catch {
    return 'Invalid Time';
  }
};

/**
 * Format datetime
 */
export const formatDateTime = (dateStr) => {
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
};

/**
 * Format currency
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

/**
 * Validate email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password
 */
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Validate phone number
 */
export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Calculate days between dates
 */
export const daysBetween = (startDate, endDate) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.round((end - start) / oneDay);
};

/**
 * Check if date is in past
 */
export const isDateInPast = (dateStr) => {
  return new Date(dateStr) < new Date();
};

/**
 * Check if date is today
 */
export const isToday = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(dateStr);
};

/**
 * Truncate string
 */
export const truncate = (str, length = 100) => {
  if (!str || str.length <= length) return str;
  return `${str.substring(0, length)}...`;
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Generate random ID
 */
export const generateId = (prefix = '') => {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Debounce function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

export default {
  formatDate,
  formatTime,
  formatDateTime,
  formatCurrency,
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  daysBetween,
  isDateInPast,
  isToday,
  getRelativeTime,
  truncate,
  capitalize,
  generateId,
  debounce,
  throttle,
};

const ApiError = require('../utils/ApiError');

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  next();
};

const createRateLimiter = ({ windowMs, max, message }) => {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const entry = hits.get(key) || { count: 0, resetAt: now + windowMs };

    if (entry.resetAt <= now) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    hits.set(key, entry);

    if (entry.count > max) {
      return next(new ApiError(429, message || 'Too many requests, please try again later'));
    }

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
    next();
  };
};

const requireProductionSecrets = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const weakSecrets = new Set([
    '',
    'your_super_secret_jwt_key_change_in_production',
    'secret',
    'changeme',
  ]);

  if (!process.env.JWT_SECRET || weakSecrets.has(process.env.JWT_SECRET)) {
    throw new Error('JWT_SECRET must be set to a strong value in production');
  }
};

module.exports = {
  securityHeaders,
  createRateLimiter,
  requireProductionSecrets,
};

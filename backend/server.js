require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const {
  securityHeaders,
  createRateLimiter,
  requireProductionSecrets,
} = require('./middleware/securityMiddleware');
const expirationService = require('./services/expirationService');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

requireProductionSecrets();
connectDB();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(securityHeaders);
app.use(cors((req, callback) => {
  const origin = req.header('Origin');
  const host = req.header('Host');
  let isAllowed = !origin;

  if (origin) {
    if (allowedOrigins.includes(origin)) {
      isAllowed = true;
    } else {
      const originHost = origin.replace(/^https?:\/\//, '');
      if (host && originHost === host) {
        isAllowed = true;
      }
    }
  }

  callback(null, {
    origin: isAllowed,
    credentials: true,
  });
}));
app.use(express.json({ limit: '10kb' }));

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many authentication attempts, please try again later',
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reserve', reservationRoutes);
app.use('/api/bookings', bookingRoutes);

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.resolve(__dirname, '../frontend/dist');

  app.use(express.static(frontendPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.use(errorHandler);

// Cron jobs only run in a long-lived server process.
// On Vercel serverless functions the process exits after each request,
// so the cron would never fire. Skip it in that environment.
const IS_VERCEL = process.env.VERCEL === '1';

if (!IS_VERCEL) {
  cron.schedule('* * * * *', async () => {
    try {
      const result = await expirationService.expireReservations();
      if (result.expiredCount > 0) {
        console.log(`Expired ${result.expiredCount} reservation(s)`);
      }
    } catch (error) {
      console.error('Cron expiration error:', error.message);
    }
  });
}

// Export the Express app for Vercel's serverless handler.
// When running locally, also start the HTTP server normally.
if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

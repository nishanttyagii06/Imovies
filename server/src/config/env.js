const dotenv = require('dotenv');
dotenv.config();

const config = {
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/imovies',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production_min_32_chars',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cookieSecret: process.env.COOKIE_SECRET || 'cookie_secret_fallback',
  seatLockTtlMinutes: parseInt(process.env.SEAT_LOCK_TTL_MINUTES || '8', 10),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
};

if (!process.env.JWT_SECRET && config.nodeEnv === 'production') {
  console.error('FATAL: JWT_SECRET environment variable is missing in production!');
  process.exit(1);
}

module.exports = config;

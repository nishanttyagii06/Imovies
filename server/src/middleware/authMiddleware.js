const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const { errorResponse } = require('../utils/responseHelper');

/**
 * Protect routes - verifies Bearer token or cookie
 */
const protect = async (req, res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return errorResponse(res, 401, 'Authentication required. Please log in.');
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return errorResponse(res, 401, 'User account no longer exists.');
    }

    if (!user.isActive) {
      return errorResponse(res, 403, 'Your account has been deactivated.');
    }

    req.user = user;
    next();
  } catch (err) {
    return errorResponse(res, 401, 'Invalid or expired session. Please log in again.');
  }
};

/**
 * Restrict to Admin role only
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return errorResponse(res, 403, 'Forbidden: Administrator privileges required.');
  }
  next();
};

/**
 * Optional authentication - attaches user if token exists, but doesn't block if missing
 */
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (e) {
      // Ignore token verification errors for optional auth
    }
  }
  next();
};

module.exports = {
  protect,
  adminOnly,
  optionalAuth,
};

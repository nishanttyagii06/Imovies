const User = require('../models/User');
const { sendTokenResponse } = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, username, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 400, 'Please provide name, email, and password.');
    }

    if (password.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters long.');
    }

    // Check existing email
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return errorResponse(res, 400, 'An account with this email address already exists.');
    }

    // Auto-generate or check username
    let finalUsername = username ? username.trim() : email.split('@')[0];
    const existingUsername = await User.findOne({ username: finalUsername });
    if (existingUsername) {
      finalUsername = `${finalUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Create user (first user is regular user; admin seeded via script or env)
    const user = await User.create({
      name: name.trim(),
      username: finalUsername,
      email: email.toLowerCase().trim(),
      password,
      phone: phone || '',
      role: 'user',
    });

    sendTokenResponse(user, 201, res, 'User account registered successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log in user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide email/username and password.');
    }

    // Find user by email or username, explicitly selecting password
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username: email.trim() },
      ],
    }).select('+password');

    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials. User not found.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid credentials. Incorrect password.');
    }

    if (!user.isActive) {
      return errorResponse(res, 403, 'Your account has been deactivated. Please contact support.');
    }

    sendTokenResponse(user, 200, res, 'Logged in successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    return successResponse(res, 200, 'User profile retrieved', user);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, password, currentPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();

    if (password) {
      if (!currentPassword) {
        return errorResponse(res, 400, 'Please provide your current password to set a new password.');
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return errorResponse(res, 400, 'Current password entered is incorrect.');
      }
      if (password.length < 6) {
        return errorResponse(res, 400, 'New password must be at least 6 characters.');
      }
      user.password = password;
    }

    await user.save();
    return successResponse(res, 200, 'Profile updated successfully', user);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out user
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  return successResponse(res, 200, 'Logged out successfully');
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  logout,
};

const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @desc    Get dashboard metrics & statistics for admin
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
const getAdminStats = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalMovies,
      totalTheatres,
      upcomingShows,
      totalBookings,
      confirmedBookings,
      totalUsers,
      revenueResult,
      recentBookings,
      recentShows,
    ] = await Promise.all([
      Movie.countDocuments(),
      Theatre.countDocuments({ isActive: true }),
      Show.countDocuments({ showDate: { $gte: todayStr }, isActive: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'confirmed' }),
      User.countDocuments({ role: 'user' }),
      // Calculate revenue strictly from completed payments
      Payment.aggregate([
        { $match: { status: 'successful' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
      Booking.find()
        .populate('user', 'name email')
        .sort('-createdAt')
        .limit(6),
      Show.find({ isActive: true })
        .populate('movie', 'title posterUrl')
        .populate('theatre', 'name location.city')
        .sort('-createdAt')
        .limit(6),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    return successResponse(res, 200, 'Admin metrics loaded', {
      totalMovies,
      totalTheatres,
      upcomingShows,
      totalBookings,
      confirmedBookings,
      totalUsers,
      totalRevenue,
      recentBookings,
      recentShows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registered users with search and pagination
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    const pageNum = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * pageSize;

    const [users, total] = await Promise.all([
      User.find(query).sort('-createdAt').skip(skip).limit(pageSize),
      User.countDocuments(query),
    ]);

    return successResponse(res, 200, 'Users retrieved', {
      users,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / pageSize) || 1,
        limit: pageSize,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle user status (Active / Deactivated)
 * @route   PATCH /api/admin/users/:id/toggle-status
 * @access  Private/Admin
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Do not allow deactivating one's self
    if (user._id.toString() === req.user.id.toString()) {
      return errorResponse(res, 400, 'You cannot deactivate your own administrative account.');
    }

    user.isActive = !user.isActive;
    await user.save();

    return successResponse(
      res,
      200,
      `User account ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      user
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  toggleUserStatus,
};

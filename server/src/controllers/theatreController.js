const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * @desc    Get all theatres with optional city filter and search
 * @route   GET /api/theatres
 * @access  Public
 */
const getTheatres = async (req, res, next) => {
  try {
    const { city, search } = req.query;
    const query = { isActive: true };

    if (city && city !== 'All') {
      query['location.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
      ];
    }

    const theatres = await Theatre.find(query).sort('name');
    return successResponse(res, 200, 'Theatres fetched successfully', theatres);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get distinct list of cinema cities
 * @route   GET /api/theatres/cities
 * @access  Public
 */
const getCities = async (req, res, next) => {
  try {
    const cities = await Theatre.distinct('location.city', { isActive: true });
    return successResponse(res, 200, 'Cities fetched successfully', cities);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single theatre by ID
 * @route   GET /api/theatres/:id
 * @access  Public
 */
const getTheatreById = async (req, res, next) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return errorResponse(res, 404, 'Theatre not found');
    }
    return successResponse(res, 200, 'Theatre retrieved', theatre);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new theatre
 * @route   POST /api/theatres
 * @access  Private/Admin
 */
const createTheatre = async (req, res, next) => {
  try {
    const { name, location, contactNumber, amenities, screens } = req.body;

    if (!name || !location || !location.address || !location.city) {
      return errorResponse(res, 400, 'Theatre name, address, and city are required.');
    }

    // Default screens if not provided
    const defaultScreens = screens && screens.length > 0 ? screens : [
      {
        screenNumber: 1,
        screenName: 'Screen 1 - Standard',
        capacity: 60,
        seatLayout: {
          totalRows: 6,
          totalCols: 10,
          tiers: [
            { name: 'vip', rows: ['A', 'B'], defaultPrice: 400 },
            { name: 'premium', rows: ['C', 'D'], defaultPrice: 280 },
            { name: 'standard', rows: ['E', 'F'], defaultPrice: 180 },
          ],
        },
      },
    ];

    const theatre = await Theatre.create({
      name,
      location,
      contactNumber: contactNumber || '',
      amenities: amenities || ['Dolby Atmos', '4K Projection', 'Recliner Seats'],
      screens: defaultScreens,
    });

    return successResponse(res, 201, 'Theatre created successfully', theatre);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update theatre details
 * @route   PUT /api/theatres/:id
 * @access  Private/Admin
 */
const updateTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!theatre) {
      return errorResponse(res, 404, 'Theatre not found');
    }

    return successResponse(res, 200, 'Theatre updated successfully', theatre);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete theatre
 * @route   DELETE /api/theatres/:id
 * @access  Private/Admin
 */
const deleteTheatre = async (req, res, next) => {
  try {
    const theatreId = req.params.id;

    const showsCount = await Show.countDocuments({ theatre: theatreId, isActive: true });
    if (showsCount > 0) {
      return errorResponse(
        res,
        400,
        `Cannot delete theatre. There are ${showsCount} active shows scheduled here.`
      );
    }

    const theatre = await Theatre.findByIdAndDelete(theatreId);
    if (!theatre) {
      return errorResponse(res, 404, 'Theatre not found');
    }

    return successResponse(res, 200, 'Theatre deleted successfully', { id: theatreId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTheatres,
  getCities,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
};

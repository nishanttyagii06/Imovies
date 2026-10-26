const Show = require('../models/Show');
const config = require('../config/env');

let ioInstance = null;

const setSocketIO = (io) => {
  ioInstance = io;
};

const getSocketIO = () => ioInstance;

/**
 * Temporarily lock seats for a user
 * @param {string} showId
 * @param {Array<string>} seatNumbers
 * @param {string} userId
 */
const lockSeats = async (showId, seatNumbers, userId) => {
  const show = await Show.findById(showId);
  if (!show || !show.isActive) {
    throw new Error('Show not found or inactive');
  }

  const now = new Date();
  const requestedSet = new Set(seatNumbers);
  const matchedSeats = [];

  // Check each requested seat's eligibility
  for (const seat of show.seats) {
    if (requestedSet.has(seat.seatNumber)) {
      const isAvailable = seat.status === 'available';
      const isExpiredLock = seat.status === 'locked' && seat.lockedUntil && new Date(seat.lockedUntil) < now;
      const isAlreadyMine = seat.status === 'locked' && seat.lockedBy && seat.lockedBy.toString() === userId.toString();

      if (!isAvailable && !isExpiredLock && !isAlreadyMine) {
        return {
          success: false,
          message: `Seat ${seat.seatNumber} is already ${seat.status === 'booked' ? 'booked' : 'locked by another customer'}.`,
        };
      }
      matchedSeats.push(seat);
    }
  }

  if (matchedSeats.length !== seatNumbers.length) {
    return {
      success: false,
      message: 'Some of the requested seats do not exist in this auditorium layout.',
    };
  }

  // Calculate expiration time
  const lockDurationMs = config.seatLockTtlMinutes * 60 * 1000;
  const expiresAt = new Date(now.getTime() + lockDurationMs);

  // Apply locks
  matchedSeats.forEach((seat) => {
    seat.status = 'locked';
    seat.lockedBy = userId;
    seat.lockedUntil = expiresAt;
  });

  await show.save();

  // Broadcast to all viewers in this show room
  if (ioInstance) {
    ioInstance.to(`show_${showId}`).emit('seats:updated', {
      showId,
      action: 'locked',
      seats: seatNumbers,
      lockedUntil: expiresAt,
    });
  }

  return {
    success: true,
    showId,
    lockedSeats: matchedSeats.map((s) => ({
      seatNumber: s.seatNumber,
      tier: s.tier,
      price: s.price,
    })),
    expiresAt,
    lockTtlSeconds: config.seatLockTtlMinutes * 60,
  };
};

/**
 * Release temporary seat locks (on user cancel, navigation away, or payment failure)
 */
const releaseSeats = async (showId, seatNumbers, userId = null) => {
  const show = await Show.findById(showId);
  if (!show) return { success: false, message: 'Show not found' };

  const requestedSet = new Set(seatNumbers);
  const released = [];

  show.seats.forEach((seat) => {
    if (requestedSet.has(seat.seatNumber)) {
      // If userId is provided, ensure user owns the lock (unless admin override)
      if (!userId || (seat.lockedBy && seat.lockedBy.toString() === userId.toString())) {
        if (seat.status === 'locked') {
          seat.status = 'available';
          seat.lockedBy = null;
          seat.lockedUntil = null;
          released.push(seat.seatNumber);
        }
      }
    }
  });

  if (released.length > 0) {
    await show.save();
    if (ioInstance) {
      ioInstance.to(`show_${showId}`).emit('seats:updated', {
        showId,
        action: 'released',
        seats: released,
      });
    }
  }

  return { success: true, releasedSeats: released };
};

/**
 * Confirm seats as booked upon successful payment
 */
const confirmSeatsBooking = async (showId, seatNumbers, userId) => {
  const show = await Show.findById(showId);
  if (!show) throw new Error('Show not found');

  const now = new Date();
  const requestedSet = new Set(seatNumbers);

  // Validate that all seats are still legitimately locked by this user
  for (const seat of show.seats) {
    if (requestedSet.has(seat.seatNumber)) {
      const isMyLock = seat.lockedBy && seat.lockedBy.toString() === userId.toString();
      const notExpired = seat.lockedUntil && new Date(seat.lockedUntil) >= now;

      if (seat.status !== 'locked' || !isMyLock || !notExpired) {
        throw new Error(
          `Seat lock expired or invalid for seat ${seat.seatNumber}. Please select your seats again.`
        );
      }
    }
  }

  // Mark all seats as permanently booked
  show.seats.forEach((seat) => {
    if (requestedSet.has(seat.seatNumber)) {
      seat.status = 'booked';
      seat.lockedBy = null;
      seat.lockedUntil = null;
    }
  });

  await show.save();

  if (ioInstance) {
    ioInstance.to(`show_${showId}`).emit('seats:updated', {
      showId,
      action: 'booked',
      seats: seatNumbers,
    });
  }

  return true;
};

/**
 * Background routine to clean up expired locks across all shows
 */
const cleanExpiredLocks = async () => {
  try {
    const now = new Date();
    // Find shows with expired locks
    const shows = await Show.find({
      'seats.status': 'locked',
      'seats.lockedUntil': { $lt: now },
    });

    for (const show of shows) {
      const expiredSeats = [];
      show.seats.forEach((seat) => {
        if (seat.status === 'locked' && seat.lockedUntil && new Date(seat.lockedUntil) < now) {
          seat.status = 'available';
          seat.lockedBy = null;
          seat.lockedUntil = null;
          expiredSeats.push(seat.seatNumber);
        }
      });

      if (expiredSeats.length > 0) {
        await show.save();
        if (ioInstance) {
          ioInstance.to(`show_${show._id}`).emit('seats:updated', {
            showId: show._id,
            action: 'released',
            seats: expiredSeats,
          });
        }
      }
    }
  } catch (err) {
    console.error('Error during cleanup of expired seat locks:', err.message);
  }
};

module.exports = {
  setSocketIO,
  getSocketIO,
  lockSeats,
  releaseSeats,
  confirmSeatsBooking,
  cleanExpiredLocks,
};

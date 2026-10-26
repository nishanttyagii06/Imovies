/**
 * Configure Socket.IO handlers for real-time seat management
 */
const setupSeatSockets = (io) => {
  io.on('connection', (socket) => {
    // Client joins a specific show auditorium room
    socket.on('join_show', (showId) => {
      if (showId) {
        socket.join(`show_${showId}`);
      }
    });

    // Client navigates away or switches shows
    socket.on('leave_show', (showId) => {
      if (showId) {
        socket.leave(`show_${showId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
};

module.exports = setupSeatSockets;

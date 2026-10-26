const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');
const { setSocketIO, cleanExpiredLocks } = require('./services/seatLockService');
const setupSeatSockets = require('./sockets/seatSocket');

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setSocketIO(io);
setupSeatSockets(io);

// Periodic cleanup of expired seat locks (every 30 seconds)
const CLEANUP_INTERVAL = 30 * 1000;
const cleanupTimer = setInterval(() => {
  cleanExpiredLocks();
}, CLEANUP_INTERVAL);

const startServer = async () => {
  await connectDB();

  server.listen(config.port, () => {
    console.log(`🎬 IMovies Server running in ${config.nodeEnv} mode on port ${config.port}`);
    console.log(`🚀 Health Check: http://localhost:${config.port}/api/health`);
  });
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  clearInterval(cleanupTimer);
  server.close(() => {
    console.log('HTTP server closed');
  });
});

if (require.main === module) {
  startServer();
}

module.exports = { app, server };

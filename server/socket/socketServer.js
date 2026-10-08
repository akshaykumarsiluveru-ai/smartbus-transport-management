import { Server } from 'socket.io';
import { socketAuthMiddleware } from './socketAuth.js';
import { registerSocketEvents } from './socketEvents.js';

let ioInstance = null;

/**
 * Initializes Socket.IO server attached to HTTP server
 * @param {import('http').Server} httpServer 
 * @param {Object} options 
 * @returns {import('socket.io').Server}
 */
export const initSocketServer = (httpServer, options = {}) => {
  const allowedOrigin = process.env.SOCKET_ORIGIN || process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

  const io = new Server(httpServer, {
    cors: {
      origin: [allowedOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    ...options,
  });

  // Attach JWT authentication middleware
  io.use(socketAuthMiddleware);

  // Connection lifecycle handler
  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.IO] Client Connected: socketId=${socket.id}, userId=${socket.user?.id}, role=${socket.user?.role}`);

    // Register event handlers
    registerSocketEvents(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket.IO] Client Disconnected: socketId=${socket.id}, userId=${socket.user?.id}, reason=${reason}`);
    });
  });

  ioInstance = io;
  return io;
};

/**
 * Getter for active Socket.IO server instance
 * @returns {import('socket.io').Server}
 */
export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO instance has not been initialized yet.');
  }
  return ioInstance;
};

export default {
  initSocketServer,
  getIO,
};

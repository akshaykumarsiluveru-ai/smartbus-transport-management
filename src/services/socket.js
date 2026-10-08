/**
 * SmartBus Real-Time Socket.IO Service
 * Manages WebSocket client connections, JWT authentication, and bus room subscriptions.
 */
import { io } from 'socket.io-client';
import { getToken } from './tokenStorage.js';
import { API_BASE_URL } from './api.js';

/**
 * Safely derive Socket.IO server backend origin URL
 * @returns {string} e.g. "http://localhost:5000"
 */
export const getSocketUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/$/, '');
  }
  // Strip trailing /api from REST API base URL
  return (API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '').replace(/\/$/, '');
};

let socketInstance = null;
let currentJoinedRoom = null;

/**
 * Retrieve or establish active Socket.IO connection attached with valid JWT
 * @returns {import('socket.io-client').Socket}
 */
export const getSocket = () => {
  const token = getToken();
  const socketUrl = getSocketUrl();

  if (!socketInstance) {
    socketInstance = io(socketUrl, {
      auth: { token: token ? `Bearer ${token}` : '' },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log(`⚡ [SocketService] Connected to real-time server: socketId=${socketInstance.id}`);
      // Re-join active room if connection was restored
      if (currentJoinedRoom) {
        const busIdMatch = currentJoinedRoom.match(/^bus:(\d+)$/);
        if (busIdMatch) {
          const busId = parseInt(busIdMatch[1], 10);
          socketInstance.emit('join_bus_room', { bus_id: busId });
        }
      }
    });

    socketInstance.on('connect_error', (err) => {
      console.warn(`⚠️ [SocketService] Connection error:`, err.message);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log(`🔌 [SocketService] Disconnected: reason=${reason}`);
    });
  } else {
    // Update token if changed
    socketInstance.auth = { token: token ? `Bearer ${token}` : '' };
    if (!socketInstance.connected && !socketInstance.connecting) {
      socketInstance.connect();
    }
  }

  return socketInstance;
};

/**
 * Cleanly disconnect Socket.IO connection and reset active room
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    if (currentJoinedRoom) {
      const busIdMatch = currentJoinedRoom.match(/^bus:(\d+)$/);
      if (busIdMatch) {
        const busId = parseInt(busIdMatch[1], 10);
        socketInstance.emit('leave_bus_room', { bus_id: busId });
      }
    }
    socketInstance.disconnect();
    socketInstance = null;
    currentJoinedRoom = null;
    console.log('🔌 [SocketService] Disconnected socket and reset state.');
  }
};

/**
 * Join bus tracking room (bus:<bus_id>)
 * @param {number|string} busId 
 * @param {Function} [ackCallback] 
 */
export const joinBusRoom = (busId, ackCallback) => {
  if (!busId) return;
  const busIdInt = parseInt(busId, 10);
  if (isNaN(busIdInt)) return;

  const targetRoom = `bus:${busIdInt}`;

  // If already in target room, skip duplicate emit
  if (currentJoinedRoom === targetRoom && socketInstance?.connected) {
    if (typeof ackCallback === 'function') {
      ackCallback({ success: true, room: targetRoom, alreadyJoined: true });
    }
    return;
  }

  // If in another room previously, leave it first
  if (currentJoinedRoom && currentJoinedRoom !== targetRoom && socketInstance?.connected) {
    const prevMatch = currentJoinedRoom.match(/^bus:(\d+)$/);
    if (prevMatch) {
      socketInstance.emit('leave_bus_room', { bus_id: parseInt(prevMatch[1], 10) });
    }
  }

  const socket = getSocket();
  if (socket) {
    socket.emit('join_bus_room', { bus_id: busIdInt }, (response) => {
      if (response && response.success !== false) {
        currentJoinedRoom = targetRoom;
        console.log(`📡 [SocketService] Joined room: ${targetRoom}`);
      } else {
        console.warn(`⚠️ [SocketService] Room join rejected:`, response?.message);
      }
      if (typeof ackCallback === 'function') ackCallback(response);
    });
  }
};

/**
 * Leave bus tracking room (bus:<bus_id>)
 * @param {number|string} busId 
 * @param {Function} [ackCallback] 
 */
export const leaveBusRoom = (busId, ackCallback) => {
  if (!busId || !socketInstance || !socketInstance.connected) return;
  const busIdInt = parseInt(busId, 10);
  if (isNaN(busIdInt)) return;

  socketInstance.emit('leave_bus_room', { bus_id: busIdInt }, (response) => {
    if (currentJoinedRoom === `bus:${busIdInt}`) {
      currentJoinedRoom = null;
    }
    if (typeof ackCallback === 'function') ackCallback(response);
  });
};

/**
 * Register event listener for real-time bus_location_update events
 * @param {Function} handler 
 */
export const onBusLocationUpdate = (handler) => {
  const socket = getSocket();
  if (socket && typeof handler === 'function') {
    socket.on('bus_location_update', handler);
  }
};

/**
 * Remove event listener for real-time bus_location_update events
 * @param {Function} handler 
 */
export const offBusLocationUpdate = (handler) => {
  if (socketInstance && typeof handler === 'function') {
    socketInstance.off('bus_location_update', handler);
  }
};

export default {
  getSocketUrl,
  getSocket,
  disconnectSocket,
  joinBusRoom,
  leaveBusRoom,
  onBusLocationUpdate,
  offBusLocationUpdate,
};

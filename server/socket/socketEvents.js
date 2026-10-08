import { canJoinBusRoom, getBusRoomName } from './socketRooms.js';

/**
 * Registers Socket.IO event handlers for authenticated sockets
 * @param {import('socket.io').Server} io 
 * @param {import('socket.io').Socket} socket 
 */
export const registerSocketEvents = (io, socket) => {
  /**
   * Handle join_bus_room event
   * Client payload: { bus_id: 1 }
   */
  socket.on('join_bus_room', async (data, ackCallback) => {
    try {
      const busId = data?.bus_id || data?.busId;
      const authResult = await canJoinBusRoom(socket.user, busId);

      if (!authResult.allowed) {
        const errPayload = {
          success: false,
          code: authResult.code || 'BUS_ROOM_FORBIDDEN',
          message: authResult.reason || 'Not authorized to join bus room.',
        };

        if (typeof ackCallback === 'function') ackCallback(errPayload);
        socket.emit('socket_error', errPayload);
        return;
      }

      const roomName = getBusRoomName(authResult.busIdInt);
      socket.join(roomName);

      const successPayload = {
        success: true,
        room: roomName,
        bus_id: authResult.busIdInt,
        message: `Successfully joined room ${roomName}`,
      };

      if (typeof ackCallback === 'function') ackCallback(successPayload);
      socket.emit('room_joined', successPayload);
    } catch (err) {
      const errPayload = {
        success: false,
        code: 'SERVER_ERROR',
        message: 'Internal error while processing room join request.',
      };

      if (typeof ackCallback === 'function') ackCallback(errPayload);
      socket.emit('socket_error', errPayload);
    }
  });

  /**
   * Handle leave_bus_room event
   * Client payload: { bus_id: 1 }
   */
  socket.on('leave_bus_room', (data, ackCallback) => {
    try {
      const busId = data?.bus_id || data?.busId;
      if (!busId) {
        const errPayload = {
          success: false,
          code: 'INVALID_PAYLOAD',
          message: 'bus_id is required to leave bus room.',
        };
        if (typeof ackCallback === 'function') ackCallback(errPayload);
        socket.emit('socket_error', errPayload);
        return;
      }

      const busIdInt = parseInt(busId, 10);
      const roomName = getBusRoomName(busIdInt);
      socket.leave(roomName);

      const successPayload = {
        success: true,
        room: roomName,
        bus_id: busIdInt,
        message: `Successfully left room ${roomName}`,
      };

      if (typeof ackCallback === 'function') ackCallback(successPayload);
      socket.emit('room_left', successPayload);
    } catch (err) {
      const errPayload = {
        success: false,
        code: 'SERVER_ERROR',
        message: 'Internal error while processing room leave request.',
      };

      if (typeof ackCallback === 'function') ackCallback(errPayload);
      socket.emit('socket_error', errPayload);
    }
  });
};

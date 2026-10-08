import pool from '../config/db.js';
import { inMemoryBuses, inMemoryDrivers } from '../config/inMemoryStore.js';

/**
 * Standard bus room name formatter
 * @param {number|string} busId 
 * @returns {string} e.g. "bus:1"
 */
export const getBusRoomName = (busId) => {
  return `bus:${busId}`;
};

/**
 * Validates bus room join permissions based on role authorization
 * @param {Object} user Decoded JWT socket user { id, role, email }
 * @param {number|string} busId Bus ID to join
 * @returns {Promise<{ allowed: boolean, code?: string, reason?: string, busIdInt?: number }>}
 */
export const canJoinBusRoom = async (user, busId) => {
  if (!busId) {
    return { allowed: false, code: 'INVALID_PAYLOAD', reason: 'bus_id is required.' };
  }

  const busIdInt = parseInt(busId, 10);
  if (isNaN(busIdInt)) {
    return { allowed: false, code: 'INVALID_PAYLOAD', reason: 'bus_id must be a valid integer.' };
  }

  // 1. Verify bus exists
  let busExists = false;
  try {
    const [busRows] = await pool.query('SELECT id FROM buses WHERE id = ?', [busIdInt]);
    busExists = busRows.length > 0;
  } catch (dbErr) {
    busExists = inMemoryBuses.some((b) => b.id === busIdInt);
  }

  if (!busExists) {
    return { allowed: false, code: 'BUS_NOT_FOUND', reason: `Bus ID ${busIdInt} not found.` };
  }

  // 2. Role-based authorization
  const role = user.role?.toLowerCase();

  // Admin & Student roles can monitor any valid bus room
  if (role === 'admin' || role === 'student') {
    return { allowed: true, busIdInt };
  }

  // Driver role can ONLY join their assigned bus room
  if (role === 'driver') {
    let assignedBusId = null;
    try {
      const [driverRows] = await pool.query('SELECT assigned_bus_id FROM drivers WHERE user_id = ?', [user.id]);
      if (driverRows.length > 0) {
        assignedBusId = driverRows[0].assigned_bus_id;
      }
    } catch (dbErr) {
      const driver = inMemoryDrivers.find((d) => d.user_id === user.id || d.id === 1);
      if (driver) {
        assignedBusId = driver.assigned_bus_id;
      }
    }

    if (assignedBusId !== busIdInt) {
      return {
        allowed: false,
        code: 'BUS_ROOM_FORBIDDEN',
        reason: `Driver is not assigned to Bus ID ${busIdInt}.`,
      };
    }

    return { allowed: true, busIdInt };
  }

  return { allowed: false, code: 'SOCKET_FORBIDDEN', reason: `Role '${user.role}' is forbidden from joining bus rooms.` };
};

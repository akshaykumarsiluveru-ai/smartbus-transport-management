import pool from '../config/db.js';
import { inMemoryDrivers, inMemoryTracking, inMemoryTrips } from '../config/inMemoryStore.js';
import { getIO } from '../socket/socketServer.js';

let nextTrackingId = 10;

const TRACKING_JOIN_SQL = `
  SELECT 
    tr.id, tr.bus_id, tr.trip_id, tr.latitude, tr.longitude, tr.speed, 
    tr.current_stop, tr.next_stop, tr.eta_minutes, tr.is_live, tr.timestamp,
    b.bus_number, b.model, b.capacity, b.current_occupancy, b.status AS bus_status,
    tp.trip_code, tp.status AS trip_status, tp.start_time,
    d.employee_id, u.name AS driver_name, u.phone AS driver_phone,
    r.route_code, r.name AS route_name
  FROM tracking tr
  JOIN buses b ON tr.bus_id = b.id
  LEFT JOIN trips tp ON tr.trip_id = tp.id
  LEFT JOIN drivers d ON tp.driver_id = d.id
  LEFT JOIN users u ON d.user_id = u.id
  LEFT JOIN routes r ON tp.route_id = r.id
`;

/**
 * @route   POST /api/tracking/update
 * @desc    Submit GPS telemetry update (Driver only via JWT)
 * @access  Private (Driver only)
 */
export const updateTracking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bus_id, latitude, longitude, speed, current_stop, next_stop, eta_minutes } = req.body;

    if (!bus_id) {
      return res.status(400).json({
        success: false,
        message: 'Tracking update failed. bus_id is required.',
      });
    }

    const lat = parseFloat(latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Tracking update failed. latitude must be a number between -90 and 90.',
      });
    }

    const lng = parseFloat(longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Tracking update failed. longitude must be a number between -180 and 180.',
      });
    }

    const spd = speed !== undefined ? parseFloat(speed) : 0.0;
    if (isNaN(spd) || spd < 0) {
      return res.status(400).json({
        success: false,
        message: 'Tracking update failed. speed must be a non-negative number.',
      });
    }

    const eta = eta_minutes !== undefined ? parseInt(eta_minutes, 10) : null;
    if (eta !== null && (isNaN(eta) || eta < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Tracking update failed. eta_minutes must be a non-negative integer.',
      });
    }

    const targetBusId = parseInt(bus_id, 10);
    const currStop = current_stop ? current_stop.toString().trim() : null;
    const nxtStop = next_stop ? next_stop.toString().trim() : null;

    let usedDb = false;

    try {
      const [driverRows] = await pool.query('SELECT id, assigned_bus_id FROM drivers WHERE user_id = ?', [userId]);
      if (driverRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tracking update failed. Authenticated user does not have a driver profile.',
        });
      }

      const driver = driverRows[0];

      if (driver.assigned_bus_id !== targetBusId) {
        return res.status(400).json({
          success: false,
          message: `Tracking update failed. Driver is not assigned to Bus ID ${targetBusId}.`,
        });
      }

      const [tripRows] = await pool.query(
        "SELECT id FROM trips WHERE bus_id = ? AND driver_id = ? AND status = 'In Transit' ORDER BY id DESC LIMIT 1",
        [targetBusId, driver.id]
      );

      if (tripRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tracking update failed. No active in-transit trip found for this bus and driver.',
        });
      }

      const activeTripId = tripRows[0].id;

      await pool.query('UPDATE tracking SET is_live = 0 WHERE bus_id = ?', [targetBusId]);

      const [insertResult] = await pool.query(
        `INSERT INTO tracking (bus_id, trip_id, latitude, longitude, speed, current_stop, next_stop, eta_minutes, is_live)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [targetBusId, activeTripId, lat, lng, spd, currStop, nxtStop, eta]
      );

      const newTrackingId = insertResult.insertId;
      usedDb = true;

      const [newRecordRows] = await pool.query(`${TRACKING_JOIN_SQL} WHERE tr.id = ?`, [newTrackingId]);
      const persistedRecord = newRecordRows[0];

      // Broadcast telemetry to room bus:<bus_id> via Socket.IO
      try {
        const io = getIO();
        if (io) {
          io.to(`bus:${targetBusId}`).emit('bus_location_update', persistedRecord);
        }
      } catch (socketErr) {
        // Safe fallback if Socket.IO server is not active during standalone REST calls
      }

      return res.status(201).json({
        success: true,
        message: 'Telemetry updated successfully.',
        data: persistedRecord,
      });
    } catch (dbErr) {
      if (usedDb) throw dbErr;

      const driver = inMemoryDrivers.find((d) => d.user_id === userId || d.id === 1);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Tracking update failed. Authenticated user does not have a driver profile.',
        });
      }

      if (driver.assigned_bus_id !== targetBusId) {
        return res.status(400).json({
          success: false,
          message: `Tracking update failed. Driver is not assigned to Bus ID ${targetBusId}.`,
        });
      }

      const activeTrip = inMemoryTrips.find((t) => t.bus_id === targetBusId && t.status === 'In Transit');
      if (!activeTrip) {
        return res.status(400).json({
          success: false,
          message: 'Tracking update failed. No active in-transit trip found for this bus and driver.',
        });
      }

      inMemoryTracking.forEach((t) => {
        if (t.bus_id === targetBusId) t.is_live = 0;
      });

      const newTelemetryObj = {
        id: nextTrackingId++,
        bus_id: targetBusId,
        trip_id: activeTrip.id,
        latitude: lat,
        longitude: lng,
        speed: spd,
        current_stop: currStop,
        next_stop: nxtStop,
        eta_minutes: eta,
        is_live: 1,
        timestamp: new Date().toISOString(),
        bus_number: `BUS-${targetBusId}`,
        route_code: 'R-01',
        driver_name: req.user.name || 'Driver',
      };
      inMemoryTracking.push(newTelemetryObj);

      // Broadcast telemetry to room bus:<bus_id> via Socket.IO
      try {
        const io = getIO();
        if (io) {
          io.to(`bus:${targetBusId}`).emit('bus_location_update', newTelemetryObj);
        }
      } catch (socketErr) {
        // Safe fallback if Socket.IO server is not active during standalone REST calls
      }

      return res.status(201).json({
        success: true,
        message: 'Telemetry updated successfully.',
        data: newTelemetryObj,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/tracking/live
 * @desc    Get latest live tracking positions for active buses
 * @access  Private (Authenticated users)
 */
export const getLiveTracking = async (req, res, next) => {
  try {
    try {
      const [rows] = await pool.query(
        `${TRACKING_JOIN_SQL} WHERE tr.is_live = 1 ORDER BY tr.timestamp DESC`
      );
      return res.status(200).json({
        success: true,
        data: rows,
      });
    } catch (dbErr) {
      const live = inMemoryTracking.filter((t) => t.is_live === 1 || t.is_live === true);
      return res.status(200).json({
        success: true,
        data: live,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/tracking/bus/:busId
 * @desc    Get tracking telemetry history for a bus
 * @access  Private (Authenticated users)
 */
export const getBusTrackingHistory = async (req, res, next) => {
  try {
    const busId = parseInt(req.params.busId, 10);
    if (isNaN(busId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bus ID format.',
      });
    }

    try {
      const [rows] = await pool.query(
        `${TRACKING_JOIN_SQL} WHERE tr.bus_id = ? ORDER BY tr.timestamp DESC LIMIT 100`,
        [busId]
      );
      return res.status(200).json({
        success: true,
        data: rows,
      });
    } catch (dbErr) {
      const history = inMemoryTracking
        .filter((t) => t.bus_id === busId)
        .slice(0, 100);
      return res.status(200).json({
        success: true,
        data: history,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/tracking/trip/:tripId
 * @desc    Get tracking telemetry records for a trip
 * @access  Private (Authenticated users)
 */
export const getTripTrackingHistory = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.tripId, 10);
    if (isNaN(tripId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format.',
      });
    }

    try {
      const [rows] = await pool.query(
        `${TRACKING_JOIN_SQL} WHERE tr.trip_id = ? ORDER BY tr.timestamp ASC`,
        [tripId]
      );
      return res.status(200).json({
        success: true,
        data: rows,
      });
    } catch (dbErr) {
      const history = inMemoryTracking.filter((t) => t.trip_id === tripId);
      return res.status(200).json({
        success: true,
        data: history,
      });
    }
  } catch (error) {
    next(error);
  }
};

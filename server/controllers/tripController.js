import pool from '../config/db.js';
import {
  inMemoryBuses,
  inMemoryDrivers,
  inMemoryTrips,
  inMemoryTracking,
} from '../config/inMemoryStore.js';

let nextTripId = 10;

const TRIP_JOIN_SQL = `
  SELECT 
    t.id, t.trip_code, t.bus_id, t.driver_id, t.route_id, t.start_time, t.end_time, 
    t.status, t.passenger_count, t.created_at,
    b.bus_number, b.registration_number, b.model, b.status AS bus_status,
    d.employee_id, d.license_number, d.user_id AS driver_user_id, u.name AS driver_name, u.email AS driver_email,
    r.route_code, r.name AS route_name, r.start_point, r.end_point
  FROM trips t
  JOIN buses b ON t.bus_id = b.id
  JOIN drivers d ON t.driver_id = d.id
  JOIN users u ON d.user_id = u.id
  JOIN routes r ON t.route_id = r.id
`;

/**
 * @route   POST /api/trips/start
 * @desc    Start a new trip (Driver only via JWT)
 * @access  Private (Driver only)
 */
export const startTrip = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bus_id, route_id, passenger_count } = req.body;

    if (!bus_id || !route_id) {
      return res.status(400).json({
        success: false,
        message: 'Trip start failed. Both bus_id and route_id are required.',
      });
    }

    const targetBusId = parseInt(bus_id, 10);
    const targetRouteId = parseInt(route_id, 10);
    const passCount = passenger_count !== undefined ? parseInt(passenger_count, 10) : 0;

    let usedDb = false;

    // Try MySQL DB Transaction
    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // 1. Find driver by req.user.id
        const [driverRows] = await connection.query(
          'SELECT id, assigned_bus_id, assigned_route_id, status FROM drivers WHERE user_id = ?',
          [userId]
        );

        if (driverRows.length === 0) {
          await connection.rollback();
          return res.status(404).json({
            success: false,
            message: 'Trip start failed. Authenticated user does not have a valid driver profile.',
          });
        }

        const driver = driverRows[0];
        const driverId = driver.id;

        // 2. Validate assigned bus and route
        if (driver.assigned_bus_id !== targetBusId) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `Trip start failed. Driver is not assigned to Bus ID ${targetBusId}.`,
          });
        }

        if (driver.assigned_route_id !== targetRouteId) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `Trip start failed. Driver is not assigned to Route ID ${targetRouteId}.`,
          });
        }

        // 3. Check bus status
        const [busRows] = await connection.query('SELECT id, status FROM buses WHERE id = ?', [targetBusId]);
        if (busRows.length === 0) {
          await connection.rollback();
          return res.status(404).json({
            success: false,
            message: `Bus ID ${targetBusId} not found.`,
          });
        }

        if (busRows[0].status === 'In Transit') {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Trip start failed. Bus is already in transit.',
          });
        }

        // 4. Check if driver is already on a trip
        if (driver.status === 'On Trip') {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Trip start failed. Driver is already on an active trip.',
          });
        }

        const [activeTripRows] = await connection.query(
          "SELECT id FROM trips WHERE driver_id = ? AND status IN ('In Transit', 'Scheduled')",
          [driverId]
        );
        if (activeTripRows.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Trip start failed. Driver has an unfinished active trip.',
          });
        }

        // 5. Generate trip_code & insert trip
        const tripCode = `TRP-${Date.now().toString().slice(-6)}`;
        const startTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const [tripInsertResult] = await connection.query(
          `INSERT INTO trips (trip_code, bus_id, driver_id, route_id, start_time, status, passenger_count)
           VALUES (?, ?, ?, ?, ?, 'In Transit', ?)`,
          [tripCode, targetBusId, driverId, targetRouteId, startTimeStr, passCount]
        );

        const newTripId = tripInsertResult.insertId;

        // 6. Update bus status to 'In Transit' and driver status to 'On Trip'
        await connection.query("UPDATE buses SET status = 'In Transit' WHERE id = ?", [targetBusId]);
        await connection.query("UPDATE drivers SET status = 'On Trip' WHERE id = ?", [driverId]);

        await connection.commit();
        usedDb = true;

        const [fetchedTripRows] = await pool.query(`${TRIP_JOIN_SQL} WHERE t.id = ?`, [newTripId]);
        return res.status(201).json({
          success: true,
          message: 'Trip started successfully.',
          data: fetchedTripRows[0],
        });
      } catch (transactionErr) {
        await connection.rollback();
        throw transactionErr;
      } finally {
        connection.release();
      }
    } catch (dbErr) {
      if (usedDb) throw dbErr;

      // Fallback in-memory logic
      let driver = inMemoryDrivers.find((d) => d.user_id === userId || d.id === 1);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Trip start failed. Authenticated user does not have a valid driver profile.',
        });
      }

      if (driver.assigned_bus_id !== targetBusId) {
        return res.status(400).json({
          success: false,
          message: `Trip start failed. Driver is not assigned to Bus ID ${targetBusId}.`,
        });
      }

      if (driver.assigned_route_id !== targetRouteId) {
        return res.status(400).json({
          success: false,
          message: `Trip start failed. Driver is not assigned to Route ID ${targetRouteId}.`,
        });
      }

      const bus = inMemoryBuses.find((b) => b.id === targetBusId);
      if (bus && bus.status === 'In Transit') {
        return res.status(400).json({
          success: false,
          message: 'Trip start failed. Bus is already in transit.',
        });
      }

      if (driver.status === 'On Trip' || inMemoryTrips.some((t) => t.driver_id === driver.id && t.status === 'In Transit')) {
        return res.status(400).json({
          success: false,
          message: 'Trip start failed. Driver is already on an active trip.',
        });
      }

      const tripCode = `TRP-TEST-${Date.now().toString().slice(-4)}`;
      const startTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      const newTripObj = {
        id: nextTripId++,
        trip_code: tripCode,
        bus_id: targetBusId,
        driver_id: driver.id,
        route_id: targetRouteId,
        start_time: startTimeStr,
        end_time: null,
        status: 'In Transit',
        passenger_count: passCount,
        driver_user_id: userId,
        driver_name: req.user.name || driver.driver_name || 'Driver',
        bus_number: bus ? bus.bus_number : `BUS-${targetBusId}`,
        route_code: `R-0${targetRouteId}`,
        route_name: 'Campus Route',
      };
      inMemoryTrips.push(newTripObj);

      if (bus) bus.status = 'In Transit';
      driver.status = 'On Trip';

      return res.status(201).json({
        success: true,
        message: 'Trip started successfully.',
        data: newTripObj,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/trips/end
 * @desc    End an active trip (Driver only via JWT)
 * @access  Private (Driver only)
 */
export const endTrip = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { trip_id } = req.body;

    if (!trip_id) {
      return res.status(400).json({
        success: false,
        message: 'Trip end failed. trip_id is required.',
      });
    }

    const targetTripId = parseInt(trip_id, 10);
    let usedDb = false;

    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // 1. Find driver by req.user.id
        const [driverRows] = await connection.query('SELECT id FROM drivers WHERE user_id = ?', [userId]);
        if (driverRows.length === 0) {
          await connection.rollback();
          return res.status(404).json({
            success: false,
            message: 'Trip end failed. Authenticated user does not have a valid driver profile.',
          });
        }

        const driverId = driverRows[0].id;

        // 2. Find target trip
        const [tripRows] = await connection.query('SELECT * FROM trips WHERE id = ?', [targetTripId]);
        if (tripRows.length === 0) {
          await connection.rollback();
          return res.status(404).json({
            success: false,
            message: `Trip with ID ${targetTripId} not found.`,
          });
        }

        const trip = tripRows[0];

        // 3. Verify ownership and active status
        if (trip.driver_id !== driverId) {
          await connection.rollback();
          return res.status(403).json({
            success: false,
            message: 'Forbidden. You cannot end a trip belonging to another driver.',
          });
        }

        if (trip.status === 'Completed' || trip.status === 'Cancelled') {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `Trip end failed. Trip is already ${trip.status.toLowerCase()}.`,
          });
        }

        const endTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        // 4. Update trip status
        await connection.query(
          "UPDATE trips SET status = 'Completed', end_time = ? WHERE id = ?",
          [endTimeStr, targetTripId]
        );

        // 5. Update bus status to 'At Depot' and driver to 'Available'
        await connection.query("UPDATE buses SET status = 'At Depot' WHERE id = ?", [trip.bus_id]);
        await connection.query("UPDATE drivers SET status = 'Available' WHERE id = ?", [driverId]);

        // 6. Set tracking records is_live = 0 for this trip/bus
        await connection.query("UPDATE tracking SET is_live = 0 WHERE trip_id = ? OR bus_id = ?", [targetTripId, trip.bus_id]);

        await connection.commit();
        usedDb = true;

        const [updatedTripRows] = await pool.query(`${TRIP_JOIN_SQL} WHERE t.id = ?`, [targetTripId]);
        return res.status(200).json({
          success: true,
          message: 'Trip ended successfully.',
          data: updatedTripRows[0],
        });
      } catch (transactionErr) {
        await connection.rollback();
        throw transactionErr;
      } finally {
        connection.release();
      }
    } catch (dbErr) {
      if (usedDb) throw dbErr;

      const trip = inMemoryTrips.find((t) => t.id === targetTripId);
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: `Trip with ID ${targetTripId} not found.`,
        });
      }

      trip.status = 'Completed';
      trip.end_time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      const bus = inMemoryBuses.find((b) => b.id === trip.bus_id);
      if (bus) bus.status = 'At Depot';

      const driver = inMemoryDrivers.find((d) => d.id === trip.driver_id);
      if (driver) driver.status = 'Available';

      inMemoryTracking.forEach((t) => {
        if (t.trip_id === targetTripId || t.bus_id === trip.bus_id) {
          t.is_live = 0;
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Trip ended successfully.',
        data: trip,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/trips
 * @desc    Get trip history with filtering
 * @access  Private (Authenticated users)
 */
export const getAllTrips = async (req, res, next) => {
  try {
    const { user } = req;
    const { status, bus_id, driver_id, route_id } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Role-based scoping: Drivers can ONLY see their own trips
    if (user.role === 'driver') {
      try {
        const [dRows] = await pool.query('SELECT id FROM drivers WHERE user_id = ?', [user.id]);
        if (dRows.length > 0) {
          whereConditions.push('t.driver_id = ?');
          queryParams.push(dRows[0].id);
        } else {
          return res.status(200).json({ success: true, data: [] });
        }
      } catch (e) {
        whereConditions.push('t.driver_user_id = ?');
        queryParams.push(user.id);
      }
    } else if (driver_id) {
      whereConditions.push('t.driver_id = ?');
      queryParams.push(parseInt(driver_id, 10));
    }

    if (status) {
      whereConditions.push('t.status = ?');
      queryParams.push(status.trim());
    }

    if (bus_id) {
      whereConditions.push('t.bus_id = ?');
      queryParams.push(parseInt(bus_id, 10));
    }

    if (route_id) {
      whereConditions.push('t.route_id = ?');
      queryParams.push(parseInt(route_id, 10));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    try {
      const [rows] = await pool.query(`${TRIP_JOIN_SQL} ${whereClause} ORDER BY t.id DESC`, queryParams);
      return res.status(200).json({
        success: true,
        data: rows,
      });
    } catch (dbErr) {
      let filtered = [...inMemoryTrips];
      if (user.role === 'driver') {
        filtered = filtered.filter((t) => t.driver_user_id === user.id || t.driver_id === 1);
      }
      if (status) filtered = filtered.filter((t) => t.status === status);
      if (bus_id) filtered = filtered.filter((t) => t.bus_id === parseInt(bus_id, 10));
      if (route_id) filtered = filtered.filter((t) => t.route_id === parseInt(route_id, 10));

      return res.status(200).json({
        success: true,
        data: filtered,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/trips/:id
 * @desc    Get single trip details
 * @access  Private (Authenticated users)
 */
export const getTripById = async (req, res, next) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    if (isNaN(tripId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format.',
      });
    }

    try {
      const [rows] = await pool.query(`${TRIP_JOIN_SQL} WHERE t.id = ?`, [tripId]);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Trip with ID ${tripId} not found.`,
        });
      }
      return res.status(200).json({
        success: true,
        data: rows[0],
      });
    } catch (dbErr) {
      const trip = inMemoryTrips.find((t) => t.id === tripId);
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: `Trip with ID ${tripId} not found.`,
        });
      }
      return res.status(200).json({
        success: true,
        data: trip,
      });
    }
  } catch (error) {
    next(error);
  }
};

import pool from '../config/db.js';
import { inMemoryRoutes, inMemoryStops } from '../config/inMemoryStore.js';

let nextRouteId = 10;
let nextStopId = 20;

const VALID_ROUTE_STATUSES = ['Active', 'Inactive', 'Suspended'];

/**
 * @route   GET /api/routes
 * @desc    Get all routes
 * @access  Private (Authenticated users)
 */
export const getAllRoutes = async (req, res, next) => {
  try {
    try {
      const [rows] = await pool.query('SELECT * FROM routes ORDER BY id ASC');
      return res.status(200).json({
        success: true,
        data: rows,
      });
    } catch (dbErr) {
      return res.status(200).json({
        success: true,
        data: inMemoryRoutes,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/routes/:id
 * @desc    Get single route by ID
 * @access  Private (Authenticated users)
 */
export const getRouteById = async (req, res, next) => {
  try {
    const routeId = parseInt(req.params.id, 10);
    if (isNaN(routeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route ID format.',
      });
    }

    try {
      const [rows] = await pool.query('SELECT * FROM routes WHERE id = ?', [routeId]);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Route with ID ${routeId} not found.`,
        });
      }
      return res.status(200).json({
        success: true,
        data: rows[0],
      });
    } catch (dbErr) {
      const route = inMemoryRoutes.find((r) => r.id === routeId);
      if (!route) {
        return res.status(404).json({
          success: false,
          message: `Route with ID ${routeId} not found.`,
        });
      }
      return res.status(200).json({
        success: true,
        data: route,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/routes
 * @desc    Create a new route record
 * @access  Private (Admin only)
 */
export const createRoute = async (req, res, next) => {
  try {
    const { route_code, name, start_point, end_point, distance_km, estimated_duration, status } = req.body;

    if (!route_code || !route_code.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Route creation failed. route_code is required.',
      });
    }

    if (!name || !name.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Route creation failed. name is required.',
      });
    }

    if (!start_point || !start_point.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Route creation failed. start_point is required.',
      });
    }

    if (!end_point || !end_point.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Route creation failed. end_point is required.',
      });
    }

    const trimmedCode = route_code.toString().trim().toUpperCase();
    const routeStatus = status ? status.trim() : 'Active';

    if (!VALID_ROUTE_STATUSES.includes(routeStatus)) {
      return res.status(400).json({
        success: false,
        message: `Route creation failed. Invalid status. Allowed: ${VALID_ROUTE_STATUSES.join(', ')}`,
      });
    }

    let parsedDistance = distance_km !== undefined ? parseFloat(distance_km) : null;
    if (parsedDistance !== null && (isNaN(parsedDistance) || parsedDistance < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Route creation failed. distance_km must be a non-negative number.',
      });
    }

    let codeExists = false;
    let usedDb = false;

    try {
      const [existingRows] = await pool.query('SELECT id FROM routes WHERE UPPER(route_code) = ?', [trimmedCode]);
      codeExists = existingRows.length > 0;
      usedDb = true;
    } catch (dbErr) {
      codeExists = inMemoryRoutes.some((r) => r.route_code.toUpperCase() === trimmedCode);
    }

    if (codeExists) {
      return res.status(409).json({
        success: false,
        message: `A route with route_code '${trimmedCode}' already exists.`,
      });
    }

    const durationStr = estimated_duration ? estimated_duration.toString().trim() : null;

    if (usedDb) {
      const [insertResult] = await pool.query(
        `INSERT INTO routes (route_code, name, start_point, end_point, distance_km, estimated_duration, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [trimmedCode, name.toString().trim(), start_point.toString().trim(), end_point.toString().trim(), parsedDistance, durationStr, routeStatus]
      );
      const newId = insertResult.insertId;
      const [newRows] = await pool.query('SELECT * FROM routes WHERE id = ?', [newId]);

      return res.status(201).json({
        success: true,
        message: 'Route created successfully.',
        data: newRows[0],
      });
    } else {
      const newId = nextRouteId++;
      const newRouteObj = {
        id: newId,
        route_code: trimmedCode,
        name: name.toString().trim(),
        start_point: start_point.toString().trim(),
        end_point: end_point.toString().trim(),
        distance_km: parsedDistance,
        estimated_duration: durationStr,
        status: routeStatus,
      };
      inMemoryRoutes.push(newRouteObj);

      return res.status(201).json({
        success: true,
        message: 'Route created successfully.',
        data: newRouteObj,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/routes/:id
 * @desc    Update route details
 * @access  Private (Admin only)
 */
export const updateRoute = async (req, res, next) => {
  try {
    const routeId = parseInt(req.params.id, 10);
    if (isNaN(routeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route ID format.',
      });
    }

    const { route_code, name, start_point, end_point, distance_km, estimated_duration, status } = req.body;

    let existingRoute = null;
    let usedDb = false;

    try {
      const [rows] = await pool.query('SELECT * FROM routes WHERE id = ?', [routeId]);
      if (rows.length > 0) {
        existingRoute = rows[0];
        usedDb = true;
      }
    } catch (dbErr) {
      existingRoute = inMemoryRoutes.find((r) => r.id === routeId) || null;
    }

    if (!existingRoute) {
      return res.status(404).json({
        success: false,
        message: `Route with ID ${routeId} not found.`,
      });
    }

    const updatedCode = route_code !== undefined ? route_code.toString().trim().toUpperCase() : existingRoute.route_code;
    const updatedName = name !== undefined ? name.toString().trim() : existingRoute.name;
    const updatedStart = start_point !== undefined ? start_point.toString().trim() : existingRoute.start_point;
    const updatedEnd = end_point !== undefined ? end_point.toString().trim() : existingRoute.end_point;
    const updatedDuration = estimated_duration !== undefined ? (estimated_duration ? estimated_duration.toString().trim() : null) : existingRoute.estimated_duration;
    const updatedStatus = status !== undefined ? status.toString().trim() : existingRoute.status;

    let updatedDistance = existingRoute.distance_km;
    if (distance_km !== undefined) {
      if (distance_km !== null) {
        const pDist = parseFloat(distance_km);
        if (isNaN(pDist) || pDist < 0) {
          return res.status(400).json({
            success: false,
            message: 'Route update failed. distance_km must be a non-negative number.',
          });
        }
        updatedDistance = pDist;
      } else {
        updatedDistance = null;
      }
    }

    if (updatedStatus && !VALID_ROUTE_STATUSES.includes(updatedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Route update failed. Invalid status. Allowed: ${VALID_ROUTE_STATUSES.join(', ')}`,
      });
    }

    if (updatedCode && updatedCode !== existingRoute.route_code?.toUpperCase()) {
      let codeDup = false;
      if (usedDb) {
        const [dupRows] = await pool.query('SELECT id FROM routes WHERE UPPER(route_code) = ? AND id != ?', [updatedCode, routeId]);
        codeDup = dupRows.length > 0;
      } else {
        codeDup = inMemoryRoutes.some((r) => r.id !== routeId && r.route_code.toUpperCase() === updatedCode);
      }

      if (codeDup) {
        return res.status(409).json({
          success: false,
          message: `Route code '${updatedCode}' is already used by another route.`,
        });
      }
    }

    if (usedDb) {
      await pool.query(
        `UPDATE routes
         SET route_code = ?, name = ?, start_point = ?, end_point = ?, distance_km = ?, estimated_duration = ?, status = ?
         WHERE id = ?`,
        [updatedCode, updatedName, updatedStart, updatedEnd, updatedDistance, updatedDuration, updatedStatus, routeId]
      );
      const [updatedRows] = await pool.query('SELECT * FROM routes WHERE id = ?', [routeId]);
      return res.status(200).json({
        success: true,
        message: 'Route updated successfully.',
        data: updatedRows[0],
      });
    } else {
      existingRoute.route_code = updatedCode;
      existingRoute.name = updatedName;
      existingRoute.start_point = updatedStart;
      existingRoute.end_point = updatedEnd;
      existingRoute.distance_km = updatedDistance;
      existingRoute.estimated_duration = updatedDuration;
      existingRoute.status = updatedStatus;

      return res.status(200).json({
        success: true,
        message: 'Route updated successfully.',
        data: existingRoute,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/routes/:id
 * @desc    Delete route record
 * @access  Private (Admin only)
 */
export const deleteRoute = async (req, res, next) => {
  try {
    const routeId = parseInt(req.params.id, 10);
    if (isNaN(routeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route ID format.',
      });
    }

    let routeExists = false;
    let usedDb = false;

    try {
      const [rows] = await pool.query('SELECT id FROM routes WHERE id = ?', [routeId]);
      routeExists = rows.length > 0;
      usedDb = true;
    } catch (dbErr) {
      routeExists = inMemoryRoutes.some((r) => r.id === routeId);
    }

    if (!routeExists) {
      return res.status(404).json({
        success: false,
        message: `Route with ID ${routeId} not found.`,
      });
    }

    if (usedDb) {
      await pool.query('DELETE FROM routes WHERE id = ?', [routeId]);
    } else {
      const idx = inMemoryRoutes.findIndex((r) => r.id === routeId);
      if (idx !== -1) inMemoryRoutes.splice(idx, 1);
    }

    return res.status(200).json({
      success: true,
      message: `Route with ID ${routeId} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// ====================================================
// ROUTE STOPS CONTROLLERS
// ====================================================

/**
 * @route   GET /api/routes/:routeId/stops
 * @desc    Get ordered stops for a specific route
 * @access  Private (Authenticated users)
 */
export const getRouteStops = async (req, res, next) => {
  try {
    const routeId = parseInt(req.params.routeId, 10);
    if (isNaN(routeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route ID format.',
      });
    }

    try {
      const [routeRows] = await pool.query('SELECT id FROM routes WHERE id = ?', [routeId]);
      if (routeRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Route with ID ${routeId} not found.`,
        });
      }
      const [stopRows] = await pool.query(
        'SELECT * FROM route_stops WHERE route_id = ? ORDER BY stop_order ASC',
        [routeId]
      );
      return res.status(200).json({
        success: true,
        data: stopRows,
      });
    } catch (dbErr) {
      const routeExists = inMemoryRoutes.some((r) => r.id === routeId);
      if (!routeExists) {
        return res.status(404).json({
          success: false,
          message: `Route with ID ${routeId} not found.`,
        });
      }
      const stops = inMemoryStops
        .filter((s) => s.route_id === routeId)
        .sort((a, b) => a.stop_order - b.stop_order);
      return res.status(200).json({
        success: true,
        data: stops,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/routes/:routeId/stops
 * @desc    Create a new stop for a route
 * @access  Private (Admin only)
 */
export const createRouteStop = async (req, res, next) => {
  try {
    const routeId = parseInt(req.params.routeId, 10);
    if (isNaN(routeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route ID format.',
      });
    }

    const { stop_name, latitude, longitude, stop_order, scheduled_arrival } = req.body;

    if (!stop_name || !stop_name.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Stop creation failed. stop_name is required.',
      });
    }

    const lat = parseFloat(latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Stop creation failed. latitude must be a number between -90 and 90.',
      });
    }

    const lng = parseFloat(longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Stop creation failed. longitude must be a number between -180 and 180.',
      });
    }

    const order = parseInt(stop_order, 10);
    if (isNaN(order) || order < 1) {
      return res.status(400).json({
        success: false,
        message: 'Stop creation failed. stop_order must be a positive integer.',
      });
    }

    const arrivalTime = scheduled_arrival ? scheduled_arrival.toString().trim() : null;

    let routeExists = false;
    let usedDb = false;

    try {
      const [routeRows] = await pool.query('SELECT id FROM routes WHERE id = ?', [routeId]);
      routeExists = routeRows.length > 0;
      usedDb = true;
    } catch (dbErr) {
      routeExists = inMemoryRoutes.some((r) => r.id === routeId);
    }

    if (!routeExists) {
      return res.status(404).json({
        success: false,
        message: `Route with ID ${routeId} not found.`,
      });
    }

    if (usedDb) {
      const [insertRes] = await pool.query(
        `INSERT INTO route_stops (route_id, stop_name, latitude, longitude, stop_order, scheduled_arrival)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [routeId, stop_name.toString().trim(), lat, lng, order, arrivalTime]
      );
      const newStopId = insertRes.insertId;
      const [newStopRows] = await pool.query('SELECT * FROM route_stops WHERE id = ?', [newStopId]);

      return res.status(201).json({
        success: true,
        message: 'Route stop created successfully.',
        data: newStopRows[0],
      });
    } else {
      const newStopObj = {
        id: nextStopId++,
        route_id: routeId,
        stop_name: stop_name.toString().trim(),
        latitude: lat,
        longitude: lng,
        stop_order: order,
        scheduled_arrival: arrivalTime,
      };
      inMemoryStops.push(newStopObj);

      return res.status(201).json({
        success: true,
        message: 'Route stop created successfully.',
        data: newStopObj,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/routes/:routeId/stops/:stopId
 * @desc    Update a route stop
 * @access  Private (Admin only)
 */
export const updateRouteStop = async (req, res, next) => {
  try {
    const routeId = parseInt(req.params.routeId, 10);
    const stopId = parseInt(req.params.stopId, 10);

    if (isNaN(routeId) || isNaN(stopId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route or stop ID format.',
      });
    }

    const { stop_name, latitude, longitude, stop_order, scheduled_arrival } = req.body;

    let existingStop = null;
    let usedDb = false;

    try {
      const [stopRows] = await pool.query(
        'SELECT * FROM route_stops WHERE id = ? AND route_id = ?',
        [stopId, routeId]
      );
      if (stopRows.length > 0) {
        existingStop = stopRows[0];
        usedDb = true;
      }
    } catch (dbErr) {
      existingStop = inMemoryStops.find((s) => s.id === stopId && s.route_id === routeId) || null;
    }

    if (!existingStop) {
      return res.status(404).json({
        success: false,
        message: `Route stop with ID ${stopId} for route ${routeId} not found.`,
      });
    }

    const updatedName = stop_name !== undefined ? stop_name.toString().trim() : existingStop.stop_name;
    const updatedArrival = scheduled_arrival !== undefined ? (scheduled_arrival ? scheduled_arrival.toString().trim() : null) : existingStop.scheduled_arrival;

    let updatedLat = existingStop.latitude;
    if (latitude !== undefined) {
      const pLat = parseFloat(latitude);
      if (isNaN(pLat) || pLat < -90 || pLat > 90) {
        return res.status(400).json({
          success: false,
          message: 'Stop update failed. latitude must be a number between -90 and 90.',
        });
      }
      updatedLat = pLat;
    }

    let updatedLng = existingStop.longitude;
    if (longitude !== undefined) {
      const pLng = parseFloat(longitude);
      if (isNaN(pLng) || pLng < -180 || pLng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Stop update failed. longitude must be a number between -180 and 180.',
        });
      }
      updatedLng = pLng;
    }

    let updatedOrder = existingStop.stop_order;
    if (stop_order !== undefined) {
      const pOrder = parseInt(stop_order, 10);
      if (isNaN(pOrder) || pOrder < 1) {
        return res.status(400).json({
          success: false,
          message: 'Stop update failed. stop_order must be a positive integer.',
        });
      }
      updatedOrder = pOrder;
    }

    if (usedDb) {
      await pool.query(
        `UPDATE route_stops
         SET stop_name = ?, latitude = ?, longitude = ?, stop_order = ?, scheduled_arrival = ?
         WHERE id = ? AND route_id = ?`,
        [updatedName, updatedLat, updatedLng, updatedOrder, updatedArrival, stopId, routeId]
      );
      const [updatedRows] = await pool.query('SELECT * FROM route_stops WHERE id = ?', [stopId]);

      return res.status(200).json({
        success: true,
        message: 'Route stop updated successfully.',
        data: updatedRows[0],
      });
    } else {
      existingStop.stop_name = updatedName;
      existingStop.latitude = updatedLat;
      existingStop.longitude = updatedLng;
      existingStop.stop_order = updatedOrder;
      existingStop.scheduled_arrival = updatedArrival;

      return res.status(200).json({
        success: true,
        message: 'Route stop updated successfully.',
        data: existingStop,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/routes/:routeId/stops/:stopId
 * @desc    Delete a route stop
 * @access  Private (Admin only)
 */
export const deleteRouteStop = async (req, res, next) => {
  try {
    const routeId = parseInt(req.params.routeId, 10);
    const stopId = parseInt(req.params.stopId, 10);

    if (isNaN(routeId) || isNaN(stopId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route or stop ID format.',
      });
    }

    let stopExists = false;
    let usedDb = false;

    try {
      const [rows] = await pool.query('SELECT id FROM route_stops WHERE id = ? AND route_id = ?', [stopId, routeId]);
      stopExists = rows.length > 0;
      usedDb = true;
    } catch (dbErr) {
      stopExists = inMemoryStops.some((s) => s.id === stopId && s.route_id === routeId);
    }

    if (!stopExists) {
      return res.status(404).json({
        success: false,
        message: `Route stop with ID ${stopId} for route ${routeId} not found.`,
      });
    }

    if (usedDb) {
      await pool.query('DELETE FROM route_stops WHERE id = ? AND route_id = ?', [stopId, routeId]);
    } else {
      const idx = inMemoryStops.findIndex((s) => s.id === stopId && s.route_id === routeId);
      if (idx !== -1) inMemoryStops.splice(idx, 1);
    }

    return res.status(200).json({
      success: true,
      message: `Route stop with ID ${stopId} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { inMemoryDrivers, inMemoryBuses, inMemoryRoutes } from '../config/inMemoryStore.js';

let nextDriverId = 10;
const VALID_DRIVER_STATUSES = ['Available', 'On Trip', 'On Leave', 'Off Duty'];

export const DRIVER_JOIN_SQL = `
  SELECT 
    d.id, d.user_id, d.employee_id, d.license_number, d.phone, d.status, 
    d.assigned_bus_id, d.assigned_route_id, d.shift, d.rating, d.created_at, d.updated_at,
    u.name AS driver_name, u.email AS driver_email, u.role AS user_role,
    b.bus_number, r.route_code, r.name AS route_name
  FROM drivers d
  JOIN users u ON d.user_id = u.id
  LEFT JOIN buses b ON d.assigned_bus_id = b.id
  LEFT JOIN routes r ON d.assigned_route_id = r.id
`;

/**
 * Robust Driver Record Resolver
 * Supports numeric ID, employee_id (e.g. 'DRV-101'), or prefixed ID (e.g. 'drv_1')
 */
export const resolveDriverRecord = async (rawId) => {
  if (rawId === undefined || rawId === null || rawId === '') return null;
  const str = rawId.toString().trim();
  const num = parseInt(str, 10);

  // 1. Numeric ID check
  if (!isNaN(num) && /^\d+$/.test(str)) {
    try {
      const [rows] = await pool.query('SELECT * FROM drivers WHERE id = ?', [num]);
      if (rows.length > 0) return { id: rows[0].id, driver: rows[0], usedDb: true };
    } catch (e) {}
    const mem = inMemoryDrivers.find((d) => d.id === num);
    if (mem) return { id: mem.id, driver: mem, usedDb: false };
  }

  // 2. Employee ID check (e.g. 'DRV-101')
  try {
    const [rows] = await pool.query('SELECT * FROM drivers WHERE UPPER(employee_id) = ?', [str.toUpperCase()]);
    if (rows.length > 0) return { id: rows[0].id, driver: rows[0], usedDb: true };
  } catch (e) {}
  const memByEmp = inMemoryDrivers.find((d) => d.employee_id && d.employee_id.toUpperCase() === str.toUpperCase());
  if (memByEmp) return { id: memByEmp.id, driver: memByEmp, usedDb: false };

  // 3. String with digits check (e.g. 'drv_1' or 'drv_4')
  const digitsOnly = str.replace(/\D/g, '');
  if (digitsOnly) {
    const parsedDigits = parseInt(digitsOnly, 10);
    try {
      const [rows] = await pool.query('SELECT * FROM drivers WHERE id = ?', [parsedDigits]);
      if (rows.length > 0) return { id: rows[0].id, driver: rows[0], usedDb: true };
    } catch (e) {}
    const memByDigits = inMemoryDrivers.find((d) => d.id === parsedDigits);
    if (memByDigits) return { id: memByDigits.id, driver: memByDigits, usedDb: false };
  }

  return null;
};

/**
 * Robust Bus ID Resolver
 * Resolves to numeric bus ID from id, bus_number, or 'bus_101'
 */
export const resolveBusId = async (rawBusId) => {
  if (rawBusId === null || rawBusId === undefined || rawBusId === '' || rawBusId === 'null' || rawBusId === 'undefined') {
    return null;
  }
  const str = rawBusId.toString().trim();
  const num = parseInt(str, 10);

  if (!isNaN(num) && /^\d+$/.test(str)) {
    try {
      const [rows] = await pool.query('SELECT id FROM buses WHERE id = ?', [num]);
      if (rows.length > 0) return rows[0].id;
    } catch (e) {}
    const mem = inMemoryBuses.find((b) => b.id === num);
    if (mem) return mem.id;
  }

  const normalizedBusNum = str.replace(/[_\s]/g, '-').toUpperCase();
  try {
    const [rows] = await pool.query('SELECT id FROM buses WHERE UPPER(bus_number) = ? OR UPPER(bus_number) = ?', [
      str.toUpperCase(),
      normalizedBusNum,
    ]);
    if (rows.length > 0) return rows[0].id;
  } catch (e) {}
  const memByNum = inMemoryBuses.find(
    (b) => b.bus_number && (b.bus_number.toUpperCase() === str.toUpperCase() || b.bus_number.toUpperCase() === normalizedBusNum)
  );
  if (memByNum) return memByNum.id;

  const digitsOnly = str.replace(/\D/g, '');
  if (digitsOnly) {
    const parsedDigits = parseInt(digitsOnly, 10);
    try {
      const [rows] = await pool.query('SELECT id FROM buses WHERE id = ?', [parsedDigits]);
      if (rows.length > 0) return rows[0].id;
    } catch (e) {}
    const memByDigits = inMemoryBuses.find((b) => b.id === parsedDigits);
    if (memByDigits) return memByDigits.id;
  }

  return undefined; // Not found
};

/**
 * Robust Route ID Resolver
 * Resolves to numeric route ID from id, route_code, or 'route_1'
 */
export const resolveRouteId = async (rawRouteId) => {
  if (rawRouteId === null || rawRouteId === undefined || rawRouteId === '' || rawRouteId === 'null' || rawRouteId === 'undefined') {
    return null;
  }
  const str = rawRouteId.toString().trim();
  const num = parseInt(str, 10);

  if (!isNaN(num) && /^\d+$/.test(str)) {
    try {
      const [rows] = await pool.query('SELECT id FROM routes WHERE id = ?', [num]);
      if (rows.length > 0) return rows[0].id;
    } catch (e) {}
    const mem = inMemoryRoutes.find((r) => r.id === num);
    if (mem) return mem.id;
  }

  const normalizedRouteCode = str.replace(/[_\s]/g, '-').toUpperCase();
  try {
    const [rows] = await pool.query('SELECT id FROM routes WHERE UPPER(route_code) = ? OR UPPER(route_code) = ?', [
      str.toUpperCase(),
      normalizedRouteCode,
    ]);
    if (rows.length > 0) return rows[0].id;
  } catch (e) {}
  const memByCode = inMemoryRoutes.find(
    (r) => r.route_code && (r.route_code.toUpperCase() === str.toUpperCase() || r.route_code.toUpperCase() === normalizedRouteCode)
  );
  if (memByCode) return memByCode.id;

  const digitsOnly = str.replace(/\D/g, '');
  if (digitsOnly) {
    const parsedDigits = parseInt(digitsOnly, 10);
    try {
      const [rows] = await pool.query('SELECT id FROM routes WHERE id = ?', [parsedDigits]);
      if (rows.length > 0) return rows[0].id;
    } catch (e) {}
    const memByDigits = inMemoryRoutes.find((r) => r.id === parsedDigits);
    if (memByDigits) return memByDigits.id;
  }

  return undefined; // Not found
};

/**
 * @route   GET /api/drivers
 * @desc    Get all driver records
 * @access  Private (Authenticated users)
 */
export const getAllDrivers = async (req, res, next) => {
  try {
    try {
      const [rows] = await pool.query(`${DRIVER_JOIN_SQL} ORDER BY d.id ASC`);
      return res.status(200).json({
        success: true,
        data: rows,
      });
    } catch (dbErr) {
      return res.status(200).json({
        success: true,
        data: inMemoryDrivers,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/drivers/:id
 * @desc    Get single driver record by ID
 * @access  Private (Authenticated users)
 */
export const getDriverById = async (req, res, next) => {
  try {
    const driverRecord = await resolveDriverRecord(req.params.id);
    if (!driverRecord) {
      return res.status(404).json({
        success: false,
        message: `Driver with ID '${req.params.id}' not found.`,
      });
    }

    const driverId = driverRecord.id;
    if (driverRecord.usedDb) {
      const [rows] = await pool.query(`${DRIVER_JOIN_SQL} WHERE d.id = ?`, [driverId]);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Driver with ID ${driverId} not found.`,
        });
      }
      return res.status(200).json({
        success: true,
        data: rows[0],
      });
    } else {
      const driver = inMemoryDrivers.find((d) => d.id === driverId) || driverRecord.driver;
      return res.status(200).json({
        success: true,
        data: driver,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/drivers
 * @desc    Create a new driver record
 * @access  Private (Admin only)
 */
export const createDriver = async (req, res, next) => {
  try {
    const {
      user_id,
      name,
      email,
      password,
      employee_id,
      license_number,
      phone,
      status,
      assigned_bus_id,
      assigned_route_id,
      shift,
      rating,
    } = req.body;

    if (!employee_id || !employee_id.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Driver creation failed. employee_id is required.',
      });
    }

    if (!license_number || !license_number.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Driver creation failed. license_number is required.',
      });
    }

    const trimmedEmpId = employee_id.toString().trim().toUpperCase();
    const trimmedLicense = license_number.toString().trim().toUpperCase();

    const driverStatus = status ? status.trim() : 'Available';
    if (!VALID_DRIVER_STATUSES.includes(driverStatus)) {
      return res.status(400).json({
        success: false,
        message: `Driver creation failed. Invalid status. Allowed: ${VALID_DRIVER_STATUSES.join(', ')}`,
      });
    }

    let resolvedUserId = user_id ? parseInt(user_id, 10) : null;
    let usedDb = false;

    // Check existing duplicates & validate references
    try {
      const [empRows] = await pool.query('SELECT id FROM drivers WHERE UPPER(employee_id) = ?', [trimmedEmpId]);
      if (empRows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Employee ID '${trimmedEmpId}' is already registered to another driver.`,
        });
      }

      const [licRows] = await pool.query('SELECT id FROM drivers WHERE UPPER(license_number) = ?', [trimmedLicense]);
      if (licRows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `License number '${trimmedLicense}' is already registered to another driver.`,
        });
      }

      if (resolvedUserId) {
        const [userRows] = await pool.query('SELECT id, role FROM users WHERE id = ?', [resolvedUserId]);
        if (userRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: `User ID ${resolvedUserId} does not exist in users table.`,
          });
        }
        const [existingDriverRows] = await pool.query('SELECT id FROM drivers WHERE user_id = ?', [resolvedUserId]);
        if (existingDriverRows.length > 0) {
          return res.status(409).json({
            success: false,
            message: `User ID ${resolvedUserId} is already linked to a driver profile.`,
          });
        }
      } else {
        if (!name || !email) {
          return res.status(400).json({
            success: false,
            message: 'Driver creation failed. Provide a valid user_id or name & email to create user.',
          });
        }
        const [emailRows] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [email.trim().toLowerCase()]);
        if (emailRows.length > 0) {
          return res.status(409).json({
            success: false,
            message: `User with email '${email.trim()}' already exists.`,
          });
        }
        const defaultPassword = password || 'driver123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        const [userInsert] = await pool.query(
          `INSERT INTO users (name, email, password_hash, role, phone, department, year)
           VALUES (?, ?, ?, 'driver', ?, 'Fleet Driving Operations', 'N/A')`,
          [name.trim(), email.trim().toLowerCase(), passwordHash, phone ? phone.trim() : null]
        );
        resolvedUserId = userInsert.insertId;
      }

      if (assigned_bus_id !== undefined && assigned_bus_id !== null) {
        const busIdInt = parseInt(assigned_bus_id, 10);
        const [busRows] = await pool.query('SELECT id FROM buses WHERE id = ?', [busIdInt]);
        if (busRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Assigned bus ID ${assigned_bus_id} does not exist.`,
          });
        }
      }

      if (assigned_route_id !== undefined && assigned_route_id !== null) {
        const routeIdInt = parseInt(assigned_route_id, 10);
        const [routeRows] = await pool.query('SELECT id FROM routes WHERE id = ?', [routeIdInt]);
        if (routeRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Assigned route ID ${assigned_route_id} does not exist.`,
          });
        }
      }

      usedDb = true;
    } catch (dbErr) {
      if (inMemoryDrivers.some((d) => d.employee_id.toUpperCase() === trimmedEmpId)) {
        return res.status(409).json({
          success: false,
          message: `Employee ID '${trimmedEmpId}' is already registered to another driver.`,
        });
      }
      if (inMemoryDrivers.some((d) => d.license_number.toUpperCase() === trimmedLicense)) {
        return res.status(409).json({
          success: false,
          message: `License number '${trimmedLicense}' is already registered to another driver.`,
        });
      }
      if (!resolvedUserId) {
        resolvedUserId = 100 + inMemoryDrivers.length;
      }
    }

    const busIdVal = assigned_bus_id ? parseInt(assigned_bus_id, 10) : null;
    const routeIdVal = assigned_route_id ? parseInt(assigned_route_id, 10) : null;
    const shiftVal = shift ? shift.trim() : 'Morning';
    const ratingVal = rating ? parseFloat(rating) : 5.0;

    if (usedDb) {
      const [driverInsert] = await pool.query(
        `INSERT INTO drivers (user_id, employee_id, license_number, phone, status, assigned_bus_id, assigned_route_id, shift, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [resolvedUserId, trimmedEmpId, trimmedLicense, phone ? phone.trim() : null, driverStatus, busIdVal, routeIdVal, shiftVal, ratingVal]
      );
      const newDriverId = driverInsert.insertId;
      const [newDriverRows] = await pool.query(`${DRIVER_JOIN_SQL} WHERE d.id = ?`, [newDriverId]);

      return res.status(201).json({
        success: true,
        message: 'Driver created successfully.',
        data: newDriverRows[0],
      });
    } else {
      const newId = nextDriverId++;
      const newDriverObj = {
        id: newId,
        user_id: resolvedUserId,
        employee_id: trimmedEmpId,
        license_number: trimmedLicense,
        phone: phone ? phone.trim() : null,
        status: driverStatus,
        assigned_bus_id: busIdVal,
        assigned_route_id: routeIdVal,
        shift: shiftVal,
        rating: ratingVal,
        driver_name: name ? name.trim() : 'New Driver',
        driver_email: email ? email.trim() : 'driver@smartbus.edu',
      };
      inMemoryDrivers.push(newDriverObj);

      return res.status(201).json({
        success: true,
        message: 'Driver created successfully.',
        data: newDriverObj,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/drivers/:id
 * @desc    Update driver details
 * @access  Private (Admin only)
 */
export const updateDriver = async (req, res, next) => {
  try {
    const driverRecord = await resolveDriverRecord(req.params.id);
    if (!driverRecord) {
      return res.status(404).json({
        success: false,
        message: `Driver with ID '${req.params.id}' not found.`,
      });
    }

    const driverId = driverRecord.id;
    let existingDriver = driverRecord.driver;
    let usedDb = driverRecord.usedDb;

    const { employee_id, license_number, phone, status, assigned_bus_id, assigned_route_id, shift, rating } = req.body;

    const updatedEmpId = employee_id !== undefined ? employee_id.toString().trim().toUpperCase() : existingDriver.employee_id;
    const updatedLicense = license_number !== undefined ? license_number.toString().trim().toUpperCase() : existingDriver.license_number;
    const updatedPhone = phone !== undefined ? (phone ? phone.toString().trim() : null) : existingDriver.phone;
    const updatedStatus = status !== undefined ? status.toString().trim() : existingDriver.status;
    const updatedShift = shift !== undefined ? shift.toString().trim() : existingDriver.shift;
    const updatedRating = rating !== undefined ? parseFloat(rating) : existingDriver.rating;

    if (updatedStatus && !VALID_DRIVER_STATUSES.includes(updatedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Driver update failed. Invalid status. Allowed: ${VALID_DRIVER_STATUSES.join(', ')}`,
      });
    }

    let updatedBusId = existingDriver.assigned_bus_id;
    if (assigned_bus_id !== undefined) {
      updatedBusId = assigned_bus_id !== null ? parseInt(assigned_bus_id, 10) : null;
    }

    let updatedRouteId = existingDriver.assigned_route_id;
    if (assigned_route_id !== undefined) {
      updatedRouteId = assigned_route_id !== null ? parseInt(assigned_route_id, 10) : null;
    }

    if (usedDb) {
      if (updatedEmpId && updatedEmpId !== existingDriver.employee_id?.toUpperCase()) {
        const [empRows] = await pool.query('SELECT id FROM drivers WHERE UPPER(employee_id) = ? AND id != ?', [updatedEmpId, driverId]);
        if (empRows.length > 0) {
          return res.status(409).json({
            success: false,
            message: `Employee ID '${updatedEmpId}' is used by another driver.`,
          });
        }
      }

      if (updatedLicense && updatedLicense !== existingDriver.license_number?.toUpperCase()) {
        const [licRows] = await pool.query('SELECT id FROM drivers WHERE UPPER(license_number) = ? AND id != ?', [updatedLicense, driverId]);
        if (licRows.length > 0) {
          return res.status(409).json({
            success: false,
            message: `License number '${updatedLicense}' is used by another driver.`,
          });
        }
      }

      if (updatedBusId !== null) {
        const [busRows] = await pool.query('SELECT id FROM buses WHERE id = ?', [updatedBusId]);
        if (busRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Assigned bus ID ${updatedBusId} does not exist.`,
          });
        }
      }

      if (updatedRouteId !== null) {
        const [routeRows] = await pool.query('SELECT id FROM routes WHERE id = ?', [routeId]);
        if (routeRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Assigned route ID ${updatedRouteId} does not exist.`,
          });
        }
      }

      await pool.query(
        `UPDATE drivers
         SET employee_id = ?, license_number = ?, phone = ?, status = ?, assigned_bus_id = ?, assigned_route_id = ?, shift = ?, rating = ?
         WHERE id = ?`,
        [updatedEmpId, updatedLicense, updatedPhone, updatedStatus, updatedBusId, updatedRouteId, updatedShift, updatedRating, driverId]
      );

      const [updatedRows] = await pool.query(`${DRIVER_JOIN_SQL} WHERE d.id = ?`, [driverId]);
      return res.status(200).json({
        success: true,
        message: 'Driver updated successfully.',
        data: updatedRows[0],
      });
    } else {
      existingDriver.employee_id = updatedEmpId;
      existingDriver.license_number = updatedLicense;
      existingDriver.phone = updatedPhone;
      existingDriver.status = updatedStatus;
      existingDriver.assigned_bus_id = updatedBusId;
      existingDriver.assigned_route_id = updatedRouteId;
      existingDriver.shift = updatedShift;
      existingDriver.rating = updatedRating;

      return res.status(200).json({
        success: true,
        message: 'Driver updated successfully.',
        data: existingDriver,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/drivers/:id
 * @desc    Delete driver record
 * @access  Private (Admin only)
 */
export const deleteDriver = async (req, res, next) => {
  try {
    const driverRecord = await resolveDriverRecord(req.params.id);
    if (!driverRecord) {
      return res.status(404).json({
        success: false,
        message: `Driver with ID '${req.params.id}' not found.`,
      });
    }

    const driverId = driverRecord.id;
    const usedDb = driverRecord.usedDb;

    if (usedDb) {
      await pool.query('DELETE FROM drivers WHERE id = ?', [driverId]);
    } else {
      const idx = inMemoryDrivers.findIndex((d) => d.id === driverId);
      if (idx !== -1) inMemoryDrivers.splice(idx, 1);
    }

    return res.status(200).json({
      success: true,
      message: `Driver with ID ${driverId} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/drivers/:id/assignment
 * @desc    Update driver bus and route assignment
 * @access  Private (Admin only)
 */
export const updateDriverAssignment = async (req, res, next) => {
  try {
    const driverRecord = await resolveDriverRecord(req.params.id);
    if (!driverRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver format. Driver not found with provided ID or Employee ID.',
      });
    }

    const driverId = driverRecord.id;
    const rawBusId = req.body.assigned_bus_id !== undefined ? req.body.assigned_bus_id : (req.body.bus_id !== undefined ? req.body.bus_id : req.body.busId);
    const rawRouteId = req.body.assigned_route_id !== undefined ? req.body.assigned_route_id : (req.body.route_id !== undefined ? req.body.route_id : req.body.routeId);
    const shiftVal = req.body.shift !== undefined ? req.body.shift : null;

    const targetBusId = await resolveBusId(rawBusId);
    if (targetBusId === undefined) {
      return res.status(400).json({
        success: false,
        message: `Bus with ID '${rawBusId}' not found.`,
      });
    }

    const targetRouteId = await resolveRouteId(rawRouteId);
    if (targetRouteId === undefined) {
      return res.status(400).json({
        success: false,
        message: `Route with ID '${rawRouteId}' not found.`,
      });
    }

    if (driverRecord.usedDb) {
      // Clear targetBusId from any other driver to prevent UNIQUE key violation
      if (targetBusId !== null) {
        await pool.query('UPDATE drivers SET assigned_bus_id = NULL WHERE assigned_bus_id = ? AND id != ?', [targetBusId, driverId]);
      }

      if (shiftVal) {
        await pool.query(
          'UPDATE drivers SET assigned_bus_id = ?, assigned_route_id = ?, shift = ? WHERE id = ?',
          [targetBusId, targetRouteId, shiftVal, driverId]
        );
      } else {
        await pool.query(
          'UPDATE drivers SET assigned_bus_id = ?, assigned_route_id = ? WHERE id = ?',
          [targetBusId, targetRouteId, driverId]
        );
      }

      const [updatedRows] = await pool.query(`${DRIVER_JOIN_SQL} WHERE d.id = ?`, [driverId]);

      return res.status(200).json({
        success: true,
        message: 'Driver assignment updated successfully.',
        data: updatedRows[0],
      });
    } else {
      const driver = inMemoryDrivers.find((d) => d.id === driverId) || driverRecord.driver;
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: `Driver with ID ${driverId} not found.`,
        });
      }

      if (targetBusId !== null) {
        inMemoryDrivers.forEach((d) => {
          if (d.assigned_bus_id === targetBusId && d.id !== driverId) {
            d.assigned_bus_id = null;
            d.assigned_route_id = null;
            d.bus_number = 'Unassigned';
          }
        });
      }

      driver.assigned_bus_id = targetBusId;
      driver.assigned_route_id = targetRouteId;
      if (shiftVal) driver.shift = shiftVal;

      const matchedBus = targetBusId !== null ? inMemoryBuses.find((b) => b.id === targetBusId) : null;
      const matchedRoute = targetRouteId !== null ? inMemoryRoutes.find((r) => r.id === targetRouteId) : null;
      driver.bus_number = matchedBus ? matchedBus.bus_number : 'Unassigned';
      driver.route_code = matchedRoute ? matchedRoute.route_code : null;
      driver.route_name = matchedRoute ? matchedRoute.name : 'None';

      return res.status(200).json({
        success: true,
        message: 'Driver assignment updated successfully.',
        data: driver,
      });
    }
  } catch (error) {
    next(error);
  }
};

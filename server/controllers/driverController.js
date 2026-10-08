import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { inMemoryDrivers } from '../config/inMemoryStore.js';

let nextDriverId = 10;
const VALID_DRIVER_STATUSES = ['Available', 'On Trip', 'On Leave', 'Off Duty'];

const DRIVER_JOIN_SQL = `
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
    const driverId = parseInt(req.params.id, 10);
    if (isNaN(driverId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID format.',
      });
    }

    try {
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
    } catch (dbErr) {
      const driver = inMemoryDrivers.find((d) => d.id === driverId);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: `Driver with ID ${driverId} not found.`,
        });
      }
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
    const driverId = parseInt(req.params.id, 10);
    if (isNaN(driverId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID format.',
      });
    }

    const { employee_id, license_number, phone, status, assigned_bus_id, assigned_route_id, shift, rating } = req.body;

    let existingDriver = null;
    let usedDb = false;

    try {
      const [rows] = await pool.query('SELECT * FROM drivers WHERE id = ?', [driverId]);
      if (rows.length > 0) {
        existingDriver = rows[0];
        usedDb = true;
      }
    } catch (dbErr) {
      existingDriver = inMemoryDrivers.find((d) => d.id === driverId) || null;
    }

    if (!existingDriver) {
      return res.status(404).json({
        success: false,
        message: `Driver with ID ${driverId} not found.`,
      });
    }

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
    const driverId = parseInt(req.params.id, 10);
    if (isNaN(driverId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID format.',
      });
    }

    let driverExists = false;
    let usedDb = false;

    try {
      const [rows] = await pool.query('SELECT id FROM drivers WHERE id = ?', [driverId]);
      driverExists = rows.length > 0;
      usedDb = true;
    } catch (dbErr) {
      driverExists = inMemoryDrivers.some((d) => d.id === driverId);
    }

    if (!driverExists) {
      return res.status(404).json({
        success: false,
        message: `Driver with ID ${driverId} not found.`,
      });
    }

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
    const driverId = parseInt(req.params.id, 10);
    if (isNaN(driverId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID format.',
      });
    }

    const { assigned_bus_id, assigned_route_id } = req.body;

    const targetBusId = assigned_bus_id !== undefined && assigned_bus_id !== null ? parseInt(assigned_bus_id, 10) : null;
    const targetRouteId = assigned_route_id !== undefined && assigned_route_id !== null ? parseInt(assigned_route_id, 10) : null;

    let usedDb = false;

    try {
      const [driverRows] = await pool.query('SELECT id FROM drivers WHERE id = ?', [driverId]);
      if (driverRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Driver with ID ${driverId} not found.`,
        });
      }

      if (targetBusId !== null) {
        const [busRows] = await pool.query('SELECT id FROM buses WHERE id = ?', [targetBusId]);
        if (busRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Bus with ID ${targetBusId} not found.`,
          });
        }
      }

      if (targetRouteId !== null) {
        const [routeRows] = await pool.query('SELECT id FROM routes WHERE id = ?', [targetRouteId]);
        if (routeRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Route with ID ${targetRouteId} not found.`,
          });
        }
      }

      await pool.query(
        'UPDATE drivers SET assigned_bus_id = ?, assigned_route_id = ? WHERE id = ?',
        [targetBusId, targetRouteId, driverId]
      );

      const [updatedRows] = await pool.query(`${DRIVER_JOIN_SQL} WHERE d.id = ?`, [driverId]);

      return res.status(200).json({
        success: true,
        message: 'Driver assignment updated successfully.',
        data: updatedRows[0],
      });
    } catch (dbErr) {
      const driver = inMemoryDrivers.find((d) => d.id === driverId);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: `Driver with ID ${driverId} not found.`,
        });
      }

      driver.assigned_bus_id = targetBusId;
      driver.assigned_route_id = targetRouteId;

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

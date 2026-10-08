import pool from '../config/db.js';
import { inMemoryBuses } from '../config/inMemoryStore.js';

let nextBusId = 10;
const VALID_STATUSES = ['At Depot', 'In Transit', 'Delayed', 'Maintenance', 'Completed'];

/**
 * @route   GET /api/buses
 * @desc    Get all bus records
 * @access  Private (Authenticated users)
 */
export const getAllBuses = async (req, res, next) => {
  try {
    try {
      const [rows] = await pool.query('SELECT * FROM buses ORDER BY id ASC');
      return res.status(200).json({
        success: true,
        data: rows,
      });
    } catch (dbErr) {
      return res.status(200).json({
        success: true,
        data: inMemoryBuses,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/buses/:id
 * @desc    Get single bus record by ID
 * @access  Private (Authenticated users)
 */
export const getBusById = async (req, res, next) => {
  try {
    const busId = parseInt(req.params.id, 10);
    if (isNaN(busId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bus ID format.',
      });
    }

    try {
      const [rows] = await pool.query('SELECT * FROM buses WHERE id = ?', [busId]);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Bus with ID ${busId} not found.`,
        });
      }
      return res.status(200).json({
        success: true,
        data: rows[0],
      });
    } catch (dbErr) {
      const bus = inMemoryBuses.find((b) => b.id === busId);
      if (!bus) {
        return res.status(404).json({
          success: false,
          message: `Bus with ID ${busId} not found.`,
        });
      }
      return res.status(200).json({
        success: true,
        data: bus,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/buses
 * @desc    Create a new bus record
 * @access  Private (Admin only)
 */
export const createBus = async (req, res, next) => {
  try {
    const { bus_number, registration_number, model, capacity, current_occupancy, fuel_type, status } = req.body;

    if (!bus_number || !bus_number.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Bus creation failed. bus_number is required.',
      });
    }

    const trimmedBusNumber = bus_number.toString().trim().toUpperCase();
    const trimmedRegNumber = registration_number ? registration_number.toString().trim() : null;

    const parsedCapacity = parseInt(capacity, 10);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Bus creation failed. capacity must be a positive integer.',
      });
    }

    const busStatus = status ? status.trim() : 'At Depot';
    if (!VALID_STATUSES.includes(busStatus)) {
      return res.status(400).json({
        success: false,
        message: `Bus creation failed. Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const parsedOccupancy = current_occupancy ? parseInt(current_occupancy, 10) : 0;
    const busFuelType = fuel_type ? fuel_type.trim() : 'Diesel';
    const busModel = model ? model.trim() : null;

    let busNumberExists = false;
    let regNumberExists = false;
    let usedDb = false;
    let newId = null;

    try {
      const [existingNumberRows] = await pool.query(
        'SELECT id FROM buses WHERE UPPER(bus_number) = ?',
        [trimmedBusNumber]
      );
      busNumberExists = existingNumberRows.length > 0;

      if (!busNumberExists && trimmedRegNumber) {
        const [existingRegRows] = await pool.query(
          'SELECT id FROM buses WHERE UPPER(registration_number) = ?',
          [trimmedRegNumber.toUpperCase()]
        );
        regNumberExists = existingRegRows.length > 0;
      }
      usedDb = true;
    } catch (dbErr) {
      busNumberExists = inMemoryBuses.some((b) => b.bus_number.toUpperCase() === trimmedBusNumber);
      if (!busNumberExists && trimmedRegNumber) {
        regNumberExists = inMemoryBuses.some(
          (b) => b.registration_number && b.registration_number.toUpperCase() === trimmedRegNumber.toUpperCase()
        );
      }
    }

    if (busNumberExists) {
      return res.status(409).json({
        success: false,
        message: `A bus with bus_number '${trimmedBusNumber}' already exists.`,
      });
    }

    if (regNumberExists) {
      return res.status(409).json({
        success: false,
        message: `A bus with registration_number '${trimmedRegNumber}' already exists.`,
      });
    }

    if (usedDb) {
      const [insertResult] = await pool.query(
        `INSERT INTO buses (bus_number, registration_number, model, capacity, current_occupancy, fuel_type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [trimmedBusNumber, trimmedRegNumber, busModel, parsedCapacity, parsedOccupancy, busFuelType, busStatus]
      );
      newId = insertResult.insertId;
      const [newBusRows] = await pool.query('SELECT * FROM buses WHERE id = ?', [newId]);
      return res.status(201).json({
        success: true,
        message: 'Bus created successfully.',
        data: newBusRows[0],
      });
    } else {
      newId = nextBusId++;
      const newBusObj = {
        id: newId,
        bus_number: trimmedBusNumber,
        registration_number: trimmedRegNumber,
        model: busModel,
        capacity: parsedCapacity,
        current_occupancy: parsedOccupancy,
        fuel_type: busFuelType,
        status: busStatus,
      };
      inMemoryBuses.push(newBusObj);
      return res.status(201).json({
        success: true,
        message: 'Bus created successfully.',
        data: newBusObj,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/buses/:id
 * @desc    Update an existing bus record
 * @access  Private (Admin only)
 */
export const updateBus = async (req, res, next) => {
  try {
    const busId = parseInt(req.params.id, 10);
    if (isNaN(busId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bus ID format.',
      });
    }

    const { bus_number, registration_number, model, capacity, current_occupancy, fuel_type, status } = req.body;

    let existingBus = null;
    let usedDb = false;

    try {
      const [rows] = await pool.query('SELECT * FROM buses WHERE id = ?', [busId]);
      if (rows.length > 0) {
        existingBus = rows[0];
        usedDb = true;
      }
    } catch (dbErr) {
      existingBus = inMemoryBuses.find((b) => b.id === busId) || null;
    }

    if (!existingBus) {
      return res.status(404).json({
        success: false,
        message: `Bus with ID ${busId} not found.`,
      });
    }

    const updatedBusNumber = bus_number !== undefined ? bus_number.toString().trim().toUpperCase() : existingBus.bus_number;
    const updatedRegNumber = registration_number !== undefined ? (registration_number ? registration_number.toString().trim() : null) : existingBus.registration_number;
    const updatedModel = model !== undefined ? (model ? model.toString().trim() : null) : existingBus.model;
    const updatedFuelType = fuel_type !== undefined ? fuel_type.toString().trim() : existingBus.fuel_type;
    const updatedStatus = status !== undefined ? status.toString().trim() : existingBus.status;

    let updatedCapacity = existingBus.capacity;
    if (capacity !== undefined) {
      const parsedCap = parseInt(capacity, 10);
      if (isNaN(parsedCap) || parsedCap <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Bus update failed. capacity must be a positive integer.',
        });
      }
      updatedCapacity = parsedCap;
    }

    let updatedOccupancy = existingBus.current_occupancy;
    if (current_occupancy !== undefined) {
      const parsedOcc = parseInt(current_occupancy, 10);
      if (isNaN(parsedOcc) || parsedOcc < 0) {
        return res.status(400).json({
          success: false,
          message: 'Bus update failed. current_occupancy must be a non-negative integer.',
        });
      }
      updatedOccupancy = parsedOcc;
    }

    if (updatedStatus && !VALID_STATUSES.includes(updatedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Bus update failed. Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
      });
    }

    // Check duplicate bus_number on other buses
    if (updatedBusNumber && updatedBusNumber !== existingBus.bus_number?.toUpperCase()) {
      let numDup = false;
      if (usedDb) {
        const [dupRows] = await pool.query(
          'SELECT id FROM buses WHERE UPPER(bus_number) = ? AND id != ?',
          [updatedBusNumber, busId]
        );
        numDup = dupRows.length > 0;
      } else {
        numDup = inMemoryBuses.some((b) => b.id !== busId && b.bus_number.toUpperCase() === updatedBusNumber);
      }
      if (numDup) {
        return res.status(409).json({
          success: false,
          message: `Bus number '${updatedBusNumber}' is already used by another bus.`,
        });
      }
    }

    // Check duplicate registration_number on other buses
    if (updatedRegNumber && updatedRegNumber.toUpperCase() !== existingBus.registration_number?.toUpperCase()) {
      let regDup = false;
      if (usedDb) {
        const [dupRows] = await pool.query(
          'SELECT id FROM buses WHERE UPPER(registration_number) = ? AND id != ?',
          [updatedRegNumber.toUpperCase(), busId]
        );
        regDup = dupRows.length > 0;
      } else {
        regDup = inMemoryBuses.some(
          (b) => b.id !== busId && b.registration_number && b.registration_number.toUpperCase() === updatedRegNumber.toUpperCase()
        );
      }
      if (regDup) {
        return res.status(409).json({
          success: false,
          message: `Registration number '${updatedRegNumber}' is already used by another bus.`,
        });
      }
    }

    if (usedDb) {
      await pool.query(
        `UPDATE buses
         SET bus_number = ?, registration_number = ?, model = ?, capacity = ?, current_occupancy = ?, fuel_type = ?, status = ?
         WHERE id = ?`,
        [updatedBusNumber, updatedRegNumber, updatedModel, updatedCapacity, updatedOccupancy, updatedFuelType, updatedStatus, busId]
      );
      const [updatedRows] = await pool.query('SELECT * FROM buses WHERE id = ?', [busId]);
      return res.status(200).json({
        success: true,
        message: 'Bus updated successfully.',
        data: updatedRows[0],
      });
    } else {
      existingBus.bus_number = updatedBusNumber;
      existingBus.registration_number = updatedRegNumber;
      existingBus.model = updatedModel;
      existingBus.capacity = updatedCapacity;
      existingBus.current_occupancy = updatedOccupancy;
      existingBus.fuel_type = updatedFuelType;
      existingBus.status = updatedStatus;

      return res.status(200).json({
        success: true,
        message: 'Bus updated successfully.',
        data: existingBus,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/buses/:id
 * @desc    Delete a bus record
 * @access  Private (Admin only)
 */
export const deleteBus = async (req, res, next) => {
  try {
    const busId = parseInt(req.params.id, 10);
    if (isNaN(busId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bus ID format.',
      });
    }

    let busExists = false;
    let usedDb = false;

    try {
      const [rows] = await pool.query('SELECT id FROM buses WHERE id = ?', [busId]);
      busExists = rows.length > 0;
      usedDb = true;
    } catch (dbErr) {
      busExists = inMemoryBuses.some((b) => b.id === busId);
    }

    if (!busExists) {
      return res.status(404).json({
        success: false,
        message: `Bus with ID ${busId} not found.`,
      });
    }

    if (usedDb) {
      await pool.query('DELETE FROM buses WHERE id = ?', [busId]);
    } else {
      const idx = inMemoryBuses.findIndex((b) => b.id === busId);
      if (idx !== -1) inMemoryBuses.splice(idx, 1);
    }

    return res.status(200).json({
      success: true,
      message: `Bus with ID ${busId} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

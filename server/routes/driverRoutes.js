import express from 'express';
import {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  updateDriverAssignment,
} from '../controllers/driverController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET routes: accessible to all authenticated users
router.get('/', authenticateToken, getAllDrivers);
router.get('/:id', authenticateToken, getDriverById);

// Admin-only management endpoints
router.post('/', authenticateToken, authorizeRoles('admin'), createDriver);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateDriver);
router.put('/:id/assignment', authenticateToken, authorizeRoles('admin'), updateDriverAssignment);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteDriver);

export default router;

import express from 'express';
import {
  getAllBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
} from '../controllers/busController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET routes: accessible to all authenticated users
router.get('/', authenticateToken, getAllBuses);
router.get('/:id', authenticateToken, getBusById);

// Admin-only management endpoints
router.post('/', authenticateToken, authorizeRoles('admin'), createBus);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateBus);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteBus);

export default router;

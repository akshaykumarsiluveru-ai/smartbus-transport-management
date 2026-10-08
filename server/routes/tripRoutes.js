import express from 'express';
import {
  startTrip,
  endTrip,
  getAllTrips,
  getTripById,
} from '../controllers/tripController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Driver-only trip operational controls
router.post('/start', authenticateToken, authorizeRoles('driver'), startTrip);
router.post('/end', authenticateToken, authorizeRoles('driver'), endTrip);

// Query endpoints for authenticated users
router.get('/', authenticateToken, getAllTrips);
router.get('/:id', authenticateToken, getTripById);

export default router;

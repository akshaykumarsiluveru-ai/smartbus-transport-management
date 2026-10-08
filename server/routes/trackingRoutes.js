import express from 'express';
import {
  updateTracking,
  getLiveTracking,
  getBusTrackingHistory,
  getTripTrackingHistory,
} from '../controllers/trackingController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Driver-only GPS update route
router.post('/update', authenticateToken, authorizeRoles('driver'), updateTracking);

// Query routes for authenticated users
router.get('/live', authenticateToken, getLiveTracking);
router.get('/bus/:busId', authenticateToken, getBusTrackingHistory);
router.get('/trip/:tripId', authenticateToken, getTripTrackingHistory);

export default router;

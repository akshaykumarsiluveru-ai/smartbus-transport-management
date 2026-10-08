import express from 'express';
import {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteStops,
  createRouteStop,
  updateRouteStop,
  deleteRouteStop,
} from '../controllers/routeController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes CRUD
router.get('/', authenticateToken, getAllRoutes);
router.get('/:id', authenticateToken, getRouteById);
router.post('/', authenticateToken, authorizeRoles('admin'), createRoute);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateRoute);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteRoute);

// Nested Route Stops endpoints
router.get('/:routeId/stops', authenticateToken, getRouteStops);
router.post('/:routeId/stops', authenticateToken, authorizeRoles('admin'), createRouteStop);
router.put('/:routeId/stops/:stopId', authenticateToken, authorizeRoles('admin'), updateRouteStop);
router.delete('/:routeId/stops/:stopId', authenticateToken, authorizeRoles('admin'), deleteRouteStop);

export default router;

import express from 'express';
import {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
} from '../controllers/complaintController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// File new complaint (Authenticated students/users)
router.post('/', authenticateToken, createComplaint);

// View complaints (Role-scoped)
router.get('/', authenticateToken, getAllComplaints);
router.get('/:id', authenticateToken, getComplaintById);

// Admin-only complaint management
router.patch('/:id', authenticateToken, authorizeRoles('admin'), updateComplaint);

export default router;

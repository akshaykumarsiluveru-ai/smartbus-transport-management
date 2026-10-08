import express from 'express';
import {
  getAllNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
} from '../controllers/noticeController.js';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Publicly readable by all authenticated users
router.get('/', authenticateToken, getAllNotices);
router.get('/:id', authenticateToken, getNoticeById);

// Admin-only management endpoints
router.post('/', authenticateToken, authorizeRoles('admin'), createNotice);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateNotice);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteNotice);

export default router;

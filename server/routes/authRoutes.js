import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Authentication Endpoints
router.post('/register', register);
router.post('/login', login);

// Protected User Profile Endpoint
router.get('/me', authenticateToken, getMe);

export default router;

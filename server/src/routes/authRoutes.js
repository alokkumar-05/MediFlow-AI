import { Router } from 'express';
import {
  register,
  login,
  getMe,
  logout,
  testRole,
} from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();

// Public Authentication Endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected Authentication Endpoints
router.get('/me', authenticateUser, getMe);
router.get('/test-role', authenticateUser, testRole);

export default router;

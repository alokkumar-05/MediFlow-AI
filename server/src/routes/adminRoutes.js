import { Router } from 'express';
import {
  createStaff,
  listStaff,
  listAllUsers,
  toggleUserStatus,
} from '../controllers/adminController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// All routes in this router require authentication AND admin role
router.use(authenticateUser, authorizeRoles('admin'));

router.post('/staff', createStaff);
router.get('/staff', listStaff);
router.get('/users', listAllUsers);
router.patch('/users/:id/status', toggleUserStatus);

export default router;

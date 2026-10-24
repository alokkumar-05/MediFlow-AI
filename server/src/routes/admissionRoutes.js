import { Router } from 'express';
import {
  createAdmission,
  listAllAdmissions,
  getAdmissionById,
  updateAdmission,
  dischargePatient,
  getAdmissionMetrics,
} from '../controllers/admissionController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateUser);

// Metrics endpoint (Staff & Admin)
router.get('/metrics', authorizeRoles('admin', 'doctor', 'nurse'), getAdmissionMetrics);

// Admission management
router.post('/', authorizeRoles('admin'), createAdmission);
router.get('/', authorizeRoles('admin', 'doctor', 'nurse'), listAllAdmissions);
router.get('/:id', getAdmissionById);
router.patch('/:id', authorizeRoles('admin'), updateAdmission);
router.patch('/:id/discharge', authorizeRoles('admin', 'doctor'), dischargePatient);

export default router;

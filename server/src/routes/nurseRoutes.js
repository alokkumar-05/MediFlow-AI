import { Router } from 'express';
import {
  nurseListPatientRecords,
  nurseAddObservation,
} from '../controllers/medicalRecordController.js';
import {
  nurseListActiveAdmissions,
  getAdmissionById,
  nurseUpdateAdmissionCare,
} from '../controllers/admissionController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// All nurse routes require authentication and nurse role
router.use(authenticateUser, authorizeRoles('nurse'));

// Patient medical records & observations
router.get('/patients/:patientId/medical-records', nurseListPatientRecords);
router.post('/observations', nurseAddObservation);

// Inpatient Admissions & Ward Care
router.get('/admissions', nurseListActiveAdmissions);
router.get('/admissions/:id', getAdmissionById);
router.patch('/admissions/:id/care', nurseUpdateAdmissionCare);

export default router;


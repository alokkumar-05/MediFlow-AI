import { Router } from 'express';
import {
  patientBookAppointment,
  patientListMyAppointments,
  patientGetAppointmentById,
  patientCancelAppointment,
  patientRescheduleAppointment,
} from '../controllers/appointmentController.js';
import {
  patientListMyRecords,
  patientGetMyRecordById,
} from '../controllers/medicalRecordController.js';
import {
  patientListMyAdmissions,
  getAdmissionById,
} from '../controllers/admissionController.js';
import { patientAnalyzeMedicalReport } from '../controllers/reportAnalysisController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require authentication and patient role
router.use(authenticateUser, authorizeRoles('patient'));

// Patient Appointment Endpoints
router.post('/appointments', patientBookAppointment);
router.get('/appointments', patientListMyAppointments);
router.get('/appointments/:id', patientGetAppointmentById);
router.patch('/appointments/:id/cancel', patientCancelAppointment);
router.post('/appointments/:id/reschedule', patientRescheduleAppointment);

// Patient Medical Record Endpoints
router.get('/medical-records', patientListMyRecords);
router.get('/medical-records/:id', patientGetMyRecordById);

// Patient Inpatient Admission Endpoints
router.get('/admissions', patientListMyAdmissions);
router.get('/admissions/:id', getAdmissionById);

// Task 14: Patient Medical Report Analysis
router.post('/analyze-report', patientAnalyzeMedicalReport);

export default router;



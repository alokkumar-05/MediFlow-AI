import { Router } from 'express';
import {
  doctorGetMyProfile,
  doctorUpdateMyProfile,
  doctorGetMyAvailability,
  doctorUpdateMyAvailability,
  doctorToggleMyAvailability,
} from '../controllers/doctorController.js';
import {
  doctorListMyAppointments,
  doctorGetAppointmentById,
  doctorTransitionAppointmentStatus,
} from '../controllers/appointmentController.js';
import {
  doctorCreateMedicalRecord,
  doctorListPatientRecords,
  doctorGetRecordById,
  doctorUpdateMedicalRecord,
} from '../controllers/medicalRecordController.js';
import {
  doctorListAssignedAdmissions,
  getAdmissionById,
  dischargePatient,
} from '../controllers/admissionController.js';
import { generatePatientSummary } from '../controllers/aiSummaryController.js';
import { doctorAnalyzeMedicalReport } from '../controllers/reportAnalysisController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// All doctor self-service routes require authentication and doctor role
router.use(authenticateUser, authorizeRoles('doctor'));

// Doctor self profile
router.get('/profile', doctorGetMyProfile);
router.put('/profile', doctorUpdateMyProfile);

// Doctor self availability schedule
router.get('/availability', doctorGetMyAvailability);
router.put('/availability', doctorUpdateMyAvailability);
router.patch('/availability/status', doctorToggleMyAvailability);
router.patch('/availability/toggle', doctorToggleMyAvailability);

// Doctor appointments management
router.get('/appointments', doctorListMyAppointments);
router.get('/appointments/:id', doctorGetAppointmentById);
router.patch('/appointments/:id/status', doctorTransitionAppointmentStatus);
router.patch('/appointments/:id/confirm', (req, res, next) => {
  req.body.status = 'confirmed';
  doctorTransitionAppointmentStatus(req, res, next);
});
router.patch('/appointments/:id/complete', (req, res, next) => {
  req.body.status = 'completed';
  doctorTransitionAppointmentStatus(req, res, next);
});
router.patch('/appointments/:id/no-show', (req, res, next) => {
  req.body.status = 'no_show';
  doctorTransitionAppointmentStatus(req, res, next);
});
router.patch('/appointments/:id/cancel', (req, res, next) => {
  req.body.status = 'cancelled';
  doctorTransitionAppointmentStatus(req, res, next);
});

// Doctor Medical Records
router.post('/medical-records', doctorCreateMedicalRecord);
router.get('/medical-records/:id', doctorGetRecordById);
router.put('/medical-records/:id', doctorUpdateMedicalRecord);
router.get('/patients/:patientId/medical-records', doctorListPatientRecords);

// Doctor Inpatient Admissions
router.get('/admissions', doctorListAssignedAdmissions);
router.get('/admissions/:id', getAdmissionById);
router.patch('/admissions/:id/discharge', dischargePatient);

// Task 13: Doctor AI Patient History Summary (Protected & Grounded)
router.post('/patients/:patientId/ai-summary', generatePatientSummary);
router.get('/patients/:patientId/ai-summary', generatePatientSummary);

// Task 14: Doctor AI Medical Report Analysis (Protected & Grounded)
router.post('/patients/:patientId/analyze-report', doctorAnalyzeMedicalReport);

export default router;



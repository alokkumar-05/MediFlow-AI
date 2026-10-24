import { Router } from 'express';
import {
  createStaff,
  listStaff,
  listAllUsers,
  getUserDetails,
  toggleUserStatus,
} from '../controllers/adminController.js';
import {
  createDepartment,
  listDepartments,
  getDepartmentById,
  updateDepartment,
  toggleDepartmentStatus,
  deactivateDepartment,
} from '../controllers/departmentController.js';
import {
  adminListDoctors,
  adminGetDoctorById,
  adminCreateDoctorProfile,
  adminUpdateDoctorProfile,
  adminUpdateDoctorAvailability,
  adminToggleDoctorStatus,
} from '../controllers/doctorController.js';
import {
  adminListAllAppointments,
  adminGetAppointmentById,
  adminReassignDoctor,
  adminUpdateAppointmentStatus,
} from '../controllers/appointmentController.js';
import {
  adminListAllRecords,
  adminGetRecordById,
  adminArchiveRecord,
} from '../controllers/medicalRecordController.js';
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

// All routes in this router require authentication AND admin role
router.use(authenticateUser, authorizeRoles('admin'));

// Staff & User Management (Admin Only)
router.post('/staff', createStaff);
router.get('/staff', listStaff);
router.get('/users', listAllUsers);
router.get('/users/:id', getUserDetails);
router.patch('/users/:id/status', toggleUserStatus);

// Department Management (Admin Only)
router.post('/departments', createDepartment);
router.get('/departments', listDepartments);
router.get('/departments/:id', getDepartmentById);
router.put('/departments/:id', updateDepartment);
router.patch('/departments/:id/status', toggleDepartmentStatus);
router.delete('/departments/:id', deactivateDepartment);

// Doctor Profile & Availability Management (Admin Only)
router.get('/doctors', adminListDoctors);
router.get('/doctors/:id', adminGetDoctorById);
router.post('/doctors', adminCreateDoctorProfile);
router.put('/doctors/:id', adminUpdateDoctorProfile);
router.put('/doctors/:id/availability', adminUpdateDoctorAvailability);
router.patch('/doctors/:id/status', adminToggleDoctorStatus);
router.patch('/doctors/:id/toggle-status', adminToggleDoctorStatus);

// Appointment Oversight (Admin Only)
router.get('/appointments', adminListAllAppointments);
router.get('/appointments/:id', adminGetAppointmentById);
router.patch('/appointments/:id/assign-doctor', adminReassignDoctor);
router.patch('/appointments/:id/status', adminUpdateAppointmentStatus);

// Medical Records Oversight (Admin Only)
router.get('/medical-records', adminListAllRecords);
router.get('/medical-records/:id', adminGetRecordById);
router.patch('/medical-records/:id/archive', adminArchiveRecord);

// Hospital Admission & Inpatient Management (Admin Only)
router.get('/admissions/metrics', getAdmissionMetrics);
router.post('/admissions', createAdmission);
router.get('/admissions', listAllAdmissions);
router.get('/admissions/:id', getAdmissionById);
router.patch('/admissions/:id', updateAdmission);
router.patch('/admissions/:id/discharge', dischargePatient);

export default router;



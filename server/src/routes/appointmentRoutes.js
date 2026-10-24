import { Router } from 'express';
import {
  getAvailableSlots,
  patientBookAppointment,
  patientListMyAppointments,
  patientGetAppointmentById,
  patientCancelAppointment,
  patientRescheduleAppointment,
} from '../controllers/appointmentController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Public / Authenticated available slots query
router.get('/available-slots', getAvailableSlots);

// Patient appointment routes (Require authentication & patient role)
router.use(authenticateUser);

router.post('/', authorizeRoles('patient'), patientBookAppointment);
router.get('/my', authorizeRoles('patient'), patientListMyAppointments);
router.get('/:id', authorizeRoles('patient'), patientGetAppointmentById);
router.patch('/:id/cancel', authorizeRoles('patient'), patientCancelAppointment);
router.post('/:id/reschedule', authorizeRoles('patient'), patientRescheduleAppointment);

export default router;

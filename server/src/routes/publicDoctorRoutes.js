import { Router } from 'express';
import {
  publicListDoctors,
  publicGetDoctorById,
} from '../controllers/doctorController.js';

const router = Router();

// Public / Patient accessible doctor directory
router.get('/', publicListDoctors);
router.get('/:id', publicGetDoctorById);

export default router;

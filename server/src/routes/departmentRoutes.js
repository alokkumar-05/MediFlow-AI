import { Router } from 'express';
import Department from '../models/Department.js';

const router = Router();

// Public / Authenticated listing of active hospital departments
router.get('/', async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('headDoctor', 'name email role')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

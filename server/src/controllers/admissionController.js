import mongoose from 'mongoose';
import Admission, {
  ADMISSION_STATUSES,
  isValidAdmissionStatusTransition,
} from '../models/Admission.js';
import DoctorProfile from '../models/DoctorProfile.js';
import Department from '../models/Department.js';
import User from '../models/User.js';

// =============================================================================
// ADMIN & STAFF ADMISSION MANAGEMENT
// =============================================================================

export async function createAdmission(req, res, next) {
  try {
    const {
      patientId,
      doctorId,
      departmentId,
      admissionReason,
      bedNumber,
      admissionDate,
      notes,
    } = req.body;

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: 'Valid patientId is required' });
    }
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: 'Valid doctorId is required' });
    }
    if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ success: false, message: 'Valid departmentId is required' });
    }
    if (!admissionReason || typeof admissionReason !== 'string' || !admissionReason.trim()) {
      return res.status(400).json({ success: false, message: 'Admission reason is required' });
    }
    if (!bedNumber || typeof bedNumber !== 'string' || !bedNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Bed or room identifier is required' });
    }

    // Validate Patient
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found or invalid role' });
    }

    // Validate Doctor
    const doctor = await DoctorProfile.findById(doctorId);
    if (!doctor || !doctor.isAvailable) {
      return res.status(400).json({ success: false, message: 'Attending physician not found or unavailable' });
    }

    // Validate Department
    const department = await Department.findById(departmentId);
    if (!department || department.isActive === false) {
      return res.status(400).json({ success: false, message: 'Department not found or inactive' });
    }

    // Prevent Multiple Active Admissions for the same patient
    const existingActiveAdmission = await Admission.findOne({
      patient: patientId,
      status: 'admitted',
    });

    if (existingActiveAdmission) {
      return res.status(409).json({
        success: false,
        message: 'Patient currently has an active inpatient admission. Complete discharge before admitting again.',
        activeAdmissionId: existingActiveAdmission._id,
      });
    }

    const newAdmission = new Admission({
      patient: patientId,
      attendingDoctor: doctorId,
      department: departmentId,
      admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
      admissionReason: admissionReason.trim(),
      bedNumber: bedNumber.trim(),
      notes: notes ? notes.trim() : '',
      status: 'admitted',
      admittedBy: req.user._id,
    });

    await newAdmission.save();

    const populated = await Admission.findById(newAdmission._id)
      .populate('patient', 'name email')
      .populate({
        path: 'attendingDoctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('department', 'name code location')
      .populate('admittedBy', 'name role');

    res.status(201).json({
      success: true,
      message: 'Patient admitted successfully',
      admission: populated,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAllAdmissions(req, res, next) {
  try {
    const {
      patient,
      doctor,
      department,
      status,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {};

    if (patient && mongoose.Types.ObjectId.isValid(patient)) {
      query.patient = patient;
    }
    if (doctor && mongoose.Types.ObjectId.isValid(doctor)) {
      query.attendingDoctor = doctor;
    }
    if (department && mongoose.Types.ObjectId.isValid(department)) {
      query.department = department;
    }
    if (status && ADMISSION_STATUSES.includes(status)) {
      query.status = status;
    }
    if (startDate || endDate) {
      query.admissionDate = {};
      if (startDate) query.admissionDate.$gte = new Date(startDate);
      if (endDate) query.admissionDate.$lte = new Date(endDate);
    }
    if (search && search.trim()) {
      query.$or = [
        { bedNumber: { $regex: search.trim(), $options: 'i' } },
        { admissionReason: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const admissions = await Admission.find(query)
      .populate('patient', 'name email')
      .populate({
        path: 'attendingDoctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('department', 'name code location')
      .populate('admittedBy', 'name role')
      .populate('dischargedBy', 'name role')
      .sort({ admissionDate: -1 });

    res.status(200).json({
      success: true,
      count: admissions.length,
      admissions,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdmissionById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid admission ID' });
    }

    const admission = await Admission.findById(id)
      .populate('patient', 'name email')
      .populate({
        path: 'attendingDoctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('department', 'name code location')
      .populate('admittedBy', 'name role')
      .populate('dischargedBy', 'name role');

    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission record not found' });
    }

    // Role-based privacy verification
    if (req.user.role === 'patient') {
      if (admission.patient._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: You can only view your own admission records.',
        });
      }
    }

    res.status(200).json({
      success: true,
      admission,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAdmission(req, res, next) {
  try {
    const { id } = req.params;
    const { bedNumber, notes, attendingDoctor, department } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid admission ID' });
    }

    const admission = await Admission.findById(id);
    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission record not found' });
    }

    if (admission.status !== 'admitted') {
      return res.status(400).json({
        success: false,
        message: `Cannot update admission details when status is '${admission.status}'.`,
      });
    }

    if (bedNumber !== undefined) {
      if (!bedNumber.trim()) {
        return res.status(400).json({ success: false, message: 'Bed identifier cannot be empty' });
      }
      admission.bedNumber = bedNumber.trim();
    }
    if (notes !== undefined) admission.notes = notes.trim();

    if (attendingDoctor) {
      if (!mongoose.Types.ObjectId.isValid(attendingDoctor)) {
        return res.status(400).json({ success: false, message: 'Invalid attending doctor ID' });
      }
      const doc = await DoctorProfile.findById(attendingDoctor);
      if (!doc) return res.status(400).json({ success: false, message: 'Physician not found' });
      admission.attendingDoctor = doc._id;
    }

    if (department) {
      if (!mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({ success: false, message: 'Invalid department ID' });
      }
      const dept = await Department.findById(department);
      if (!dept) return res.status(400).json({ success: false, message: 'Department not found' });
      admission.department = dept._id;
    }

    await admission.save();

    const populated = await Admission.findById(admission._id)
      .populate('patient', 'name email')
      .populate({
        path: 'attendingDoctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('department', 'name code location')
      .populate('admittedBy', 'name role');

    res.status(200).json({
      success: true,
      message: 'Admission details updated successfully',
      admission: populated,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// DISCHARGE WORKFLOW
// =============================================================================

export async function dischargePatient(req, res, next) {
  try {
    const { id } = req.params;
    const { dischargeDate, dischargeSummary, treatmentSummary, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid admission ID' });
    }

    const admission = await Admission.findById(id);
    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission record not found' });
    }

    if (admission.status !== 'admitted') {
      return res.status(400).json({
        success: false,
        message: `Cannot discharge patient: Current admission status is '${admission.status}'.`,
      });
    }

    if (!dischargeSummary || typeof dischargeSummary !== 'string' || !dischargeSummary.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A comprehensive discharge summary is required to complete discharge.',
      });
    }

    const resolvedDischargeDate = dischargeDate ? new Date(dischargeDate) : new Date();
    if (resolvedDischargeDate < admission.admissionDate) {
      return res.status(400).json({
        success: false,
        message: 'Discharge date cannot be earlier than admission date.',
      });
    }

    admission.status = 'discharged';
    admission.dischargeDate = resolvedDischargeDate;
    admission.dischargeSummary = dischargeSummary.trim();
    if (treatmentSummary !== undefined) admission.treatmentSummary = treatmentSummary.trim();
    if (notes !== undefined) admission.notes = notes.trim();
    admission.dischargedBy = req.user._id;

    await admission.save();

    const populated = await Admission.findById(admission._id)
      .populate('patient', 'name email')
      .populate({
        path: 'attendingDoctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('department', 'name code location')
      .populate('admittedBy', 'name role')
      .populate('dischargedBy', 'name role');

    res.status(200).json({
      success: true,
      message: 'Patient discharged successfully with clinical summary.',
      admission: populated,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// DOCTOR ADMISSIONS
// =============================================================================

export async function doctorListAssignedAdmissions(req, res, next) {
  try {
    const doctorProfile = await DoctorProfile.findOne({ user: req.user._id });
    if (!doctorProfile) {
      return res.status(403).json({ success: false, message: 'Doctor profile not found' });
    }

    const { status } = req.query;
    const query = { attendingDoctor: doctorProfile._id };
    if (status && ADMISSION_STATUSES.includes(status)) {
      query.status = status;
    }

    const admissions = await Admission.find(query)
      .populate('patient', 'name email')
      .populate('department', 'name code location')
      .populate('admittedBy', 'name role')
      .populate('dischargedBy', 'name role')
      .sort({ admissionDate: -1 });

    res.status(200).json({
      success: true,
      count: admissions.length,
      admissions,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// NURSE ADMISSIONS
// =============================================================================

export async function nurseListActiveAdmissions(req, res, next) {
  try {
    const { department, status } = req.query;
    const query = {};
    if (status && ADMISSION_STATUSES.includes(status)) {
      query.status = status;
    } else {
      query.status = 'admitted'; // default to active inpatient admissions for nurses
    }

    if (department && mongoose.Types.ObjectId.isValid(department)) {
      query.department = department;
    }

    const admissions = await Admission.find(query)
      .populate('patient', 'name email')
      .populate({
        path: 'attendingDoctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('department', 'name code location')
      .populate('admittedBy', 'name role')
      .sort({ admissionDate: -1 });

    res.status(200).json({
      success: true,
      count: admissions.length,
      admissions,
    });
  } catch (error) {
    next(error);
  }
}

export async function nurseUpdateAdmissionCare(req, res, next) {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid admission ID' });
    }

    const admission = await Admission.findById(id);
    if (!admission || admission.status !== 'admitted') {
      return res.status(404).json({ success: false, message: 'Active admission record not found' });
    }

    if (notes !== undefined) {
      admission.notes = notes.trim();
      await admission.save();
    }

    res.status(200).json({
      success: true,
      message: 'Nursing care observations updated',
      admission,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// PATIENT ADMISSIONS
// =============================================================================

export async function patientListMyAdmissions(req, res, next) {
  try {
    const admissions = await Admission.find({ patient: req.user._id })
      .populate({
        path: 'attendingDoctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('department', 'name code location')
      .populate('admittedBy', 'name role')
      .populate('dischargedBy', 'name role')
      .sort({ admissionDate: -1 });

    res.status(200).json({
      success: true,
      count: admissions.length,
      admissions,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// HOSPITAL ADMISSION DASHBOARD METRICS
// =============================================================================

export async function getAdmissionMetrics(req, res, next) {
  try {
    const [activeCount, dischargedCount, recentAdmissions, recentDischarges] = await Promise.all([
      Admission.countDocuments({ status: 'admitted' }),
      Admission.countDocuments({ status: 'discharged' }),
      Admission.find({ status: 'admitted' })
        .populate('patient', 'name email')
        .populate({
          path: 'attendingDoctor',
          populate: [{ path: 'user', select: 'name email' }],
        })
        .populate('department', 'name code')
        .sort({ admissionDate: -1 })
        .limit(5),
      Admission.find({ status: 'discharged' })
        .populate('patient', 'name email')
        .populate({
          path: 'attendingDoctor',
          populate: [{ path: 'user', select: 'name email' }],
        })
        .populate('department', 'name code')
        .sort({ dischargeDate: -1 })
        .limit(5),
    ]);

    res.status(200).json({
      success: true,
      metrics: {
        activeCount,
        dischargedCount,
        recentAdmissions,
        recentDischarges,
      },
    });
  } catch (error) {
    next(error);
  }
}

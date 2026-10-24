import mongoose from 'mongoose';
import MedicalRecord, { RECORD_TYPES } from '../models/MedicalRecord.js';
import DoctorProfile from '../models/DoctorProfile.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';

// =============================================================================
// HELPER: Validate Prescriptions Array
// =============================================================================
export function validatePrescriptions(prescriptions) {
  if (!Array.isArray(prescriptions)) {
    return { valid: false, message: 'Prescriptions must be provided as an array' };
  }

  for (let i = 0; i < prescriptions.length; i++) {
    const rx = prescriptions[i];
    if (!rx || typeof rx !== 'object') {
      return { valid: false, message: `Prescription at index ${i} is invalid` };
    }
    if (!rx.medicationName || typeof rx.medicationName !== 'string' || !rx.medicationName.trim()) {
      return { valid: false, message: `Prescription at index ${i}: medicationName is required` };
    }
    if (!rx.dosage || typeof rx.dosage !== 'string' || !rx.dosage.trim()) {
      return { valid: false, message: `Prescription at index ${i}: dosage is required (e.g., 500mg)` };
    }
    if (!rx.frequency || typeof rx.frequency !== 'string' || !rx.frequency.trim()) {
      return { valid: false, message: `Prescription at index ${i}: frequency is required (e.g., Twice daily)` };
    }
    if (!rx.duration || typeof rx.duration !== 'string' || !rx.duration.trim()) {
      return { valid: false, message: `Prescription at index ${i}: duration is required (e.g., 5 days)` };
    }
  }

  return { valid: true };
}

// =============================================================================
// DOCTOR CONTROLLERS
// =============================================================================

export async function doctorCreateMedicalRecord(req, res, next) {
  try {
    const doctorProfile = await DoctorProfile.findOne({ user: req.user._id });
    if (!doctorProfile) {
      return res.status(403).json({
        success: false,
        message: 'Doctor profile not found for authenticated user',
      });
    }

    const {
      patientId,
      appointmentId,
      recordType,
      title,
      description,
      diagnosis,
      symptoms,
      treatment,
      prescriptions,
      notes,
      recordDate,
    } = req.body;

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: 'Valid patientId is required' });
    }

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found or invalid user role' });
    }

    if (!recordType || !RECORD_TYPES.includes(recordType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid recordType. Permitted values: ${RECORD_TYPES.join(', ')}`,
      });
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Record title is required' });
    }

    // Validate structured prescriptions if present
    if (prescriptions && prescriptions.length > 0) {
      const rxVal = validatePrescriptions(prescriptions);
      if (!rxVal.valid) {
        return res.status(400).json({ success: false, message: rxVal.message });
      }
    }

    // Optional appointment validation
    let validAppointmentId = null;
    if (appointmentId) {
      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        return res.status(400).json({ success: false, message: 'Invalid appointmentId format' });
      }
      const appt = await Appointment.findById(appointmentId);
      if (appt) {
        validAppointmentId = appt._id;
      }
    }

    const newRecord = new MedicalRecord({
      patient: patient._id,
      doctor: doctorProfile._id,
      appointment: validAppointmentId,
      recordType,
      title: title.trim(),
      description: description ? description.trim() : '',
      diagnosis: diagnosis ? diagnosis.trim() : '',
      symptoms: Array.isArray(symptoms) ? symptoms.map((s) => String(s).trim()).filter(Boolean) : symptoms ? [String(symptoms).trim()] : [],
      treatment: treatment ? treatment.trim() : '',
      prescriptions: Array.isArray(prescriptions) ? prescriptions : [],
      notes: notes ? notes.trim() : '',
      recordDate: recordDate ? new Date(recordDate) : new Date(),
      createdBy: req.user._id,
    });

    await newRecord.save();

    const populated = await MedicalRecord.findById(newRecord._id)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('appointment', 'appointmentDate startTime endTime status')
      .populate('createdBy', 'name role');

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      record: populated,
    });
  } catch (error) {
    next(error);
  }
}

export async function doctorListPatientRecords(req, res, next) {
  try {
    const { patientId } = req.params;
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: 'Valid patientId parameter is required' });
    }

    const query = { patient: patientId, isArchived: false };
    const { recordType, startDate, endDate } = req.query;

    if (recordType && RECORD_TYPES.includes(recordType)) {
      query.recordType = recordType;
    }

    if (startDate || endDate) {
      query.recordDate = {};
      if (startDate) query.recordDate.$gte = new Date(startDate);
      if (endDate) query.recordDate.$lte = new Date(endDate);
    }

    const records = await MedicalRecord.find(query)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('appointment', 'appointmentDate startTime endTime status')
      .populate('createdBy', 'name role')
      .sort({ recordDate: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    next(error);
  }
}

export async function doctorGetRecordById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid record ID' });
    }

    const record = await MedicalRecord.findById(id)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('appointment', 'appointmentDate startTime endTime status')
      .populate('createdBy', 'name role')
      .populate('updatedBy', 'name role');

    if (!record || record.isArchived) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    res.status(200).json({
      success: true,
      record,
    });
  } catch (error) {
    next(error);
  }
}

export async function doctorUpdateMedicalRecord(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid record ID' });
    }

    const doctorProfile = await DoctorProfile.findOne({ user: req.user._id });
    if (!doctorProfile) {
      return res.status(403).json({ success: false, message: 'Doctor profile not found' });
    }

    const record = await MedicalRecord.findById(id);
    if (!record || record.isArchived) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    // Ensure doctor is creator or assigned doctor
    const isCreator = record.createdBy.toString() === req.user._id.toString();
    const isAssignedDoctor = record.doctor && record.doctor.toString() === doctorProfile._id.toString();
    if (!isCreator && !isAssignedDoctor) {
      return res.status(403).json({
        success: false,
        message: 'You are only authorized to update medical records created by or assigned to you.',
      });
    }

    const {
      title,
      description,
      diagnosis,
      symptoms,
      treatment,
      prescriptions,
      notes,
    } = req.body;

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Title cannot be empty' });
      }
      record.title = title.trim();
    }
    if (description !== undefined) record.description = description.trim();
    if (diagnosis !== undefined) record.diagnosis = diagnosis.trim();
    if (symptoms !== undefined) {
      record.symptoms = Array.isArray(symptoms)
        ? symptoms.map((s) => String(s).trim()).filter(Boolean)
        : [String(symptoms).trim()];
    }
    if (treatment !== undefined) record.treatment = treatment.trim();
    if (notes !== undefined) record.notes = notes.trim();

    if (prescriptions !== undefined) {
      const rxVal = validatePrescriptions(prescriptions);
      if (!rxVal.valid) {
        return res.status(400).json({ success: false, message: rxVal.message });
      }
      record.prescriptions = prescriptions;
    }

    record.updatedBy = req.user._id;
    await record.save();

    const populated = await MedicalRecord.findById(record._id)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('createdBy', 'name role')
      .populate('updatedBy', 'name role');

    res.status(200).json({
      success: true,
      message: 'Medical record updated successfully',
      record: populated,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// PATIENT CONTROLLERS
// =============================================================================

export async function patientListMyRecords(req, res, next) {
  try {
    const patientId = req.user._id;
    const { recordType, startDate, endDate } = req.query;

    const query = { patient: patientId, isArchived: false };

    if (recordType && RECORD_TYPES.includes(recordType)) {
      query.recordType = recordType;
    }

    if (startDate || endDate) {
      query.recordDate = {};
      if (startDate) query.recordDate.$gte = new Date(startDate);
      if (endDate) query.recordDate.$lte = new Date(endDate);
    }

    const records = await MedicalRecord.find(query)
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('appointment', 'appointmentDate startTime endTime')
      .populate('createdBy', 'name role')
      .sort({ recordDate: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    next(error);
  }
}

export async function patientGetMyRecordById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid record ID' });
    }

    const record = await MedicalRecord.findById(id)
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('appointment', 'appointmentDate startTime endTime')
      .populate('createdBy', 'name role');

    if (!record || record.isArchived) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    // Ownership check: must belong to the authenticated patient
    if (record.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You can only view your own medical records.',
      });
    }

    res.status(200).json({
      success: true,
      record,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// NURSE CONTROLLERS
// =============================================================================

export async function nurseListPatientRecords(req, res, next) {
  try {
    const { patientId } = req.params;
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: 'Valid patientId is required' });
    }

    const records = await MedicalRecord.find({ patient: patientId, isArchived: false })
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('createdBy', 'name role')
      .sort({ recordDate: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    next(error);
  }
}

export async function nurseAddObservation(req, res, next) {
  try {
    const {
      patientId,
      title,
      description,
      notes,
      vitals,
      recordDate,
    } = req.body;

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: 'Valid patientId is required' });
    }

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Explicit security check: Nurses are forbidden from writing diagnoses or prescriptions
    if (req.body.diagnosis || (req.body.prescriptions && req.body.prescriptions.length > 0) || req.body.treatment) {
      return res.status(403).json({
        success: false,
        message: 'Nurses are not authorized to create medical diagnoses, treatments, or prescriptions.',
      });
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Observation title is required' });
    }

    const newRecord = new MedicalRecord({
      patient: patient._id,
      doctor: null,
      appointment: null,
      recordType: 'nursing_observation',
      title: title.trim(),
      description: description ? description.trim() : '',
      notes: notes ? notes.trim() : '',
      vitals: vitals || null,
      recordDate: recordDate ? new Date(recordDate) : new Date(),
      createdBy: req.user._id,
    });

    await newRecord.save();

    const populated = await MedicalRecord.findById(newRecord._id)
      .populate('patient', 'name email')
      .populate('createdBy', 'name role');

    res.status(201).json({
      success: true,
      message: 'Nursing observation recorded successfully',
      record: populated,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// ADMIN CONTROLLERS
// =============================================================================

export async function adminListAllRecords(req, res, next) {
  try {
    const { patientId, doctorId, recordType, search, startDate, endDate } = req.query;
    const query = {};

    if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
      query.patient = patientId;
    }
    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
      query.doctor = doctorId;
    }
    if (recordType && RECORD_TYPES.includes(recordType)) {
      query.recordType = recordType;
    }
    if (startDate || endDate) {
      query.recordDate = {};
      if (startDate) query.recordDate.$gte = new Date(startDate);
      if (endDate) query.recordDate.$lte = new Date(endDate);
    }
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { diagnosis: { $regex: search.trim(), $options: 'i' } },
        { treatment: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const records = await MedicalRecord.find(query)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('appointment', 'appointmentDate startTime endTime')
      .populate('createdBy', 'name role')
      .sort({ recordDate: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminGetRecordById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid record ID' });
    }

    const record = await MedicalRecord.findById(id)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('appointment', 'appointmentDate startTime endTime')
      .populate('createdBy', 'name role')
      .populate('updatedBy', 'name role');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    res.status(200).json({
      success: true,
      record,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminArchiveRecord(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid record ID' });
    }

    const record = await MedicalRecord.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    record.isArchived = true;
    record.archivedReason = reason ? reason.trim() : 'Archived by administrative audit';
    record.updatedBy = req.user._id;
    await record.save();

    res.status(200).json({
      success: true,
      message: 'Medical record archived successfully',
      record,
    });
  } catch (error) {
    next(error);
  }
}

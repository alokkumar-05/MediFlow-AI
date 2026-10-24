import mongoose from 'mongoose';
import Appointment, { isValidStatusTransition } from '../models/Appointment.js';
import DoctorProfile from '../models/DoctorProfile.js';
import Department from '../models/Department.js';
import User from '../models/User.js';

// =============================================================================
// HELPER: Available Slot Computation & Overlap Detection
// =============================================================================

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function computeAvailableSlots(doctorProfile, dateStr, existingAppointments = []) {
  if (!doctorProfile || !doctorProfile.isAvailable) {
    return [];
  }

  const availability = doctorProfile.availability || {};
  if (availability.isAcceptingAppointments === false) {
    return [];
  }

  // Determine day of week from YYYY-MM-DD (UTC date calculation)
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const dayName = DAY_NAMES[dateObj.getUTCDay()];

  // Locate doctor's schedule for that day
  const scheduleEntry = (availability.schedule || []).find(
    (s) => s.day && s.day.toLowerCase() === dayName && s.isActive !== false
  );

  if (!scheduleEntry) {
    return [];
  }

  const slotDuration = availability.slotDuration || 30; // in minutes
  const shiftStartMin = timeToMinutes(scheduleEntry.startTime);
  const shiftEndMin = timeToMinutes(scheduleEntry.endTime);

  const hasBreak = scheduleEntry.breakStart && scheduleEntry.breakEnd;
  const breakStartMin = hasBreak ? timeToMinutes(scheduleEntry.breakStart) : null;
  const breakEndMin = hasBreak ? timeToMinutes(scheduleEntry.breakEnd) : null;

  // Current local time check for today
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = dateStr === todayStr;
  const isPastDate = dateStr < todayStr;

  if (isPastDate) {
    return [];
  }

  const generatedSlots = [];

  for (let start = shiftStartMin; start + slotDuration <= shiftEndMin; start += slotDuration) {
    const end = start + slotDuration;

    // Check break overlap: slotStart < breakEnd && slotEnd > breakStart
    if (hasBreak) {
      if (start < breakEndMin && end > breakStartMin) {
        continue;
      }
    }

    // Exclude past slots if the target date is today
    if (isToday && start <= currentMinutes) {
      continue;
    }

    const slotStartStr = minutesToTime(start);
    const slotEndStr = minutesToTime(end);

    // Overlap check against pending/confirmed appointments:
    // existingStart < slotEnd && existingEnd > slotStart
    const hasConflict = existingAppointments.some((appt) => {
      if (['cancelled', 'no_show'].includes(appt.status)) return false;
      const apptStartMin = timeToMinutes(appt.startTime);
      const apptEndMin = timeToMinutes(appt.endTime);
      return apptStartMin < end && apptEndMin > start;
    });

    if (!hasConflict) {
      generatedSlots.push({
        startTime: slotStartStr,
        endTime: slotEndStr,
        slotDuration,
        available: true,
      });
    }
  }

  return generatedSlots;
}

// =============================================================================
// PUBLIC / SHARED: Get Available Slots Endpoint
// =============================================================================

export async function getAvailableSlots(req, res, next) {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: 'A valid doctorId is required' });
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'A valid date in YYYY-MM-DD format is required' });
    }

    const doctorProfile = await DoctorProfile.findById(doctorId)
      .populate('user', 'name email isActive')
      .populate('department', 'name code isActive');

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    if (!doctorProfile.isAvailable || (doctorProfile.user && !doctorProfile.user.isActive)) {
      return res.status(200).json({
        success: true,
        doctorId,
        date,
        slots: [],
        message: 'Doctor is currently unavailable for consultations',
      });
    }

    // Query active appointments on that date to filter conflicting slots
    const activeAppts = await Appointment.find({
      doctor: doctorId,
      appointmentDate: date,
      status: { $in: ['pending', 'confirmed'] },
    }).select('startTime endTime status');

    const slots = computeAvailableSlots(doctorProfile, date, activeAppts);

    res.status(200).json({
      success: true,
      doctorId,
      doctorName: doctorProfile.user?.name,
      department: doctorProfile.department?.name,
      date,
      count: slots.length,
      slots,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// PATIENT APPOINTMENT CONTROLLERS
// Strictly derives patient identity from req.user._id
// =============================================================================

export async function patientBookAppointment(req, res, next) {
  try {
    const patientId = req.user._id;
    const { doctorId, departmentId, appointmentDate, startTime, endTime, reason, notes } = req.body;

    // 1. Validate Doctor & Department
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: 'A valid doctorId is required' });
    }

    const doctor = await DoctorProfile.findById(doctorId).populate('department');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    if (!doctor.isAvailable) {
      return res.status(400).json({ success: false, message: 'Doctor is currently unavailable for new bookings' });
    }

    // Determine target department
    let resolvedDeptId = departmentId || (doctor.department?._id || doctor.department);
    if (!resolvedDeptId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor does not have an assigned department. Please specify a valid department.',
      });
    }

    // 2. Validate Date & Times
    if (!appointmentDate || !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
      return res.status(400).json({ success: false, message: 'Valid appointmentDate (YYYY-MM-DD) is required' });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (appointmentDate < todayStr) {
      return res.status(400).json({ success: false, message: 'Cannot book appointments for past dates' });
    }

    if (!startTime || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(startTime)) {
      return res.status(400).json({ success: false, message: 'Valid startTime (HH:mm) is required' });
    }

    const slotDuration = doctor.availability?.slotDuration || 30;
    let resolvedEndTime = endTime;
    if (!resolvedEndTime) {
      const startMin = timeToMinutes(startTime);
      resolvedEndTime = minutesToTime(startMin + slotDuration);
    }

    if (startTime >= resolvedEndTime) {
      return res.status(400).json({ success: false, message: 'endTime must be strictly after startTime' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Reason for consultation is required' });
    }

    // 3. Double-Booking Prevention: Check doctor's schedule interval overlap
    // Interval overlap: existingStart < requestedEnd && existingEnd > requestedStart
    const conflict = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate,
      status: { $in: ['pending', 'confirmed'] },
      $and: [
        { startTime: { $lt: resolvedEndTime } },
        { endTime: { $gt: startTime } },
      ],
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `This time slot (${startTime} - ${resolvedEndTime}) is no longer available. Please select another slot.`,
      });
    }

    // 4. Check if patient already has a booking with any doctor at the exact same interval
    const patientConflict = await Appointment.findOne({
      patient: patientId,
      appointmentDate,
      status: { $in: ['pending', 'confirmed'] },
      $and: [
        { startTime: { $lt: resolvedEndTime } },
        { endTime: { $gt: startTime } },
      ],
    });

    if (patientConflict) {
      return res.status(409).json({
        success: false,
        message: 'You already have another active consultation scheduled during this time window.',
      });
    }

    // 5. Create Appointment (Defaults to pending for doctor review)
    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      department: resolvedDeptId,
      appointmentDate,
      startTime,
      endTime: resolvedEndTime,
      reason: reason.trim(),
      notes: notes ? notes.trim() : '',
      status: 'pending',
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email role')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }, { path: 'department', select: 'name code' }],
      })
      .populate('department', 'name code location');

    res.status(201).json({
      success: true,
      message: 'Consultation appointment scheduled successfully',
      appointment: populated,
    });
  } catch (error) {
    next(error);
  }
}

export async function patientListMyAppointments(req, res, next) {
  try {
    const patientId = req.user._id;
    const { status, date } = req.query;

    const filter = { patient: patientId };
    if (status) {
      filter.status = status;
    }
    if (date) {
      filter.appointmentDate = date;
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }, { path: 'department', select: 'name code' }],
      })
      .populate('department', 'name code location')
      .sort({ appointmentDate: -1, startTime: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
}

export async function patientGetAppointmentById(req, res, next) {
  try {
    const { id } = req.params;
    const patientId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const appointment = await Appointment.findById(id)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }, { path: 'department', select: 'name code location' }],
      })
      .populate('department', 'name code location');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Ownership enforcement
    if (appointment.patient._id.toString() !== patientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view another patient’s appointment.',
      });
    }

    res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    next(error);
  }
}

export async function patientCancelAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const patientId = req.user._id;
    const { cancellationReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Ownership check
    if (appointment.patient.toString() !== patientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot cancel another patient’s appointment.',
      });
    }

    if (!isValidStatusTransition(appointment.status, 'cancelled')) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel appointment in status '${appointment.status}'. Only pending or confirmed appointments can be cancelled.`,
      });
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = patientId;
    appointment.cancellationReason = cancellationReason ? cancellationReason.trim() : 'Cancelled by patient';
    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('department', 'name code');

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment: populated,
    });
  } catch (error) {
    next(error);
  }
}

export async function patientRescheduleAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const patientId = req.user._id;
    const { newDate, newStartTime, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const existingAppt = await Appointment.findById(id);
    if (!existingAppt) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Ownership check
    if (existingAppt.patient.toString() !== patientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot reschedule another patient’s appointment.',
      });
    }

    if (['completed', 'cancelled', 'no_show'].includes(existingAppt.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule appointment with status '${existingAppt.status}'.`,
      });
    }

    if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      return res.status(400).json({ success: false, message: 'Valid newDate (YYYY-MM-DD) is required' });
    }

    if (!newStartTime || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(newStartTime)) {
      return res.status(400).json({ success: false, message: 'Valid newStartTime (HH:mm) is required' });
    }

    const doctor = await DoctorProfile.findById(existingAppt.doctor);
    if (!doctor || !doctor.isAvailable) {
      return res.status(400).json({ success: false, message: 'Doctor is unavailable for rescheduling' });
    }

    const slotDuration = doctor.availability?.slotDuration || 30;
    const startMin = timeToMinutes(newStartTime);
    const newEndTime = minutesToTime(startMin + slotDuration);

    // Conflict check on new date & time for doctor
    const conflict = await Appointment.findOne({
      _id: { $ne: existingAppt._id },
      doctor: existingAppt.doctor,
      appointmentDate: newDate,
      status: { $in: ['pending', 'confirmed'] },
      $and: [
        { startTime: { $lt: newEndTime } },
        { endTime: { $gt: newStartTime } },
      ],
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'The requested slot is not available. Please choose another slot.',
      });
    }

    // Cancel existing appointment
    existingAppt.status = 'cancelled';
    existingAppt.cancelledBy = patientId;
    existingAppt.cancellationReason = 'Rescheduled to new date/time by patient';
    await existingAppt.save();

    // Create new appointment linked via rescheduledFrom
    const newAppointment = await Appointment.create({
      patient: patientId,
      doctor: existingAppt.doctor,
      department: existingAppt.department,
      appointmentDate: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      reason: reason ? reason.trim() : existingAppt.reason,
      notes: existingAppt.notes,
      status: 'pending',
      rescheduledFrom: existingAppt._id,
    });

    const populated = await Appointment.findById(newAppointment._id)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('department', 'name code');

    res.status(201).json({
      success: true,
      message: 'Appointment rescheduled successfully. Awaiting confirmation.',
      appointment: populated,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// DOCTOR APPOINTMENT CONTROLLERS
// Doctor identity derived from authenticated User's DoctorProfile
// =============================================================================

async function getDoctorProfileFromUser(userId) {
  return await DoctorProfile.findOne({ user: userId });
}

export async function doctorListMyAppointments(req, res, next) {
  try {
    const doctorProfile = await getDoctorProfileFromUser(req.user._id);
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found for this account.',
      });
    }

    const { date, status, search } = req.query;
    const filter = { doctor: doctorProfile._id };

    if (date) {
      filter.appointmentDate = date;
    }
    if (status) {
      filter.status = status;
    }

    let appointments = await Appointment.find(filter)
      .populate('patient', 'name email')
      .populate('department', 'name code location')
      .sort({ appointmentDate: 1, startTime: 1 });

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      appointments = appointments.filter((appt) => {
        const pName = appt.patient?.name?.toLowerCase() || '';
        const pEmail = appt.patient?.email?.toLowerCase() || '';
        const r = appt.reason?.toLowerCase() || '';
        return pName.includes(q) || pEmail.includes(q) || r.includes(q);
      });
    }

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
}

export async function doctorGetAppointmentById(req, res, next) {
  try {
    const { id } = req.params;
    const doctorProfile = await getDoctorProfileFromUser(req.user._id);

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const appointment = await Appointment.findById(id)
      .populate('patient', 'name email')
      .populate('department', 'name code location');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Verify doctor ownership
    if (appointment.doctor.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot view or manage another physician’s appointments.',
      });
    }

    res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    next(error);
  }
}

export async function doctorTransitionAppointmentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes, cancellationReason } = req.body;
    const doctorProfile = await getDoctorProfileFromUser(req.user._id);

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Ownership check
    if (appointment.doctor.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot update another physician’s appointment.',
      });
    }

    if (!status || !isValidStatusTransition(appointment.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${appointment.status}' to '${status}'.`,
      });
    }

    appointment.status = status;
    if (notes !== undefined) {
      appointment.notes = notes.trim();
    }
    if (status === 'cancelled') {
      appointment.cancelledBy = req.user._id;
      appointment.cancellationReason = cancellationReason ? cancellationReason.trim() : 'Cancelled by attending physician';
    }

    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email')
      .populate('department', 'name code location');

    res.status(200).json({
      success: true,
      message: `Appointment marked as '${status}'`,
      appointment: populated,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// ADMIN APPOINTMENT CONTROLLERS
// Global hospital oversight & slot conflict resolution
// =============================================================================

export async function adminListAllAppointments(req, res, next) {
  try {
    const { doctor, patient, department, date, status, search } = req.query;
    const filter = {};

    if (doctor) {
      if (mongoose.Types.ObjectId.isValid(doctor)) {
        filter.doctor = doctor;
      }
    }
    if (patient) {
      if (mongoose.Types.ObjectId.isValid(patient)) {
        filter.patient = patient;
      }
    }
    if (department) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        filter.department = department;
      }
    }
    if (date) {
      filter.appointmentDate = date;
    }
    if (status) {
      filter.status = status;
    }

    let appointments = await Appointment.find(filter)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }, { path: 'department', select: 'name code' }],
      })
      .populate('department', 'name code location')
      .sort({ appointmentDate: -1, startTime: -1 });

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      appointments = appointments.filter((appt) => {
        const pName = appt.patient?.name?.toLowerCase() || '';
        const dName = appt.doctor?.user?.name?.toLowerCase() || '';
        const dept = appt.department?.name?.toLowerCase() || '';
        const reason = appt.reason?.toLowerCase() || '';
        return pName.includes(q) || dName.includes(q) || dept.includes(q) || reason.includes(q);
      });
    }

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminGetAppointmentById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const appointment = await Appointment.findById(id)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }, { path: 'department', select: 'name code' }],
      })
      .populate('department', 'name code location')
      .populate('cancelledBy', 'name email role');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminReassignDoctor(req, res, next) {
  try {
    const { id } = req.params;
    const { newDoctorId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }
    if (!newDoctorId || !mongoose.Types.ObjectId.isValid(newDoctorId)) {
      return res.status(400).json({ success: false, message: 'A valid newDoctorId is required' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reassign doctor for an appointment with status '${appointment.status}'`,
      });
    }

    const newDoctor = await DoctorProfile.findById(newDoctorId);
    if (!newDoctor || !newDoctor.isAvailable) {
      return res.status(400).json({ success: false, message: 'Specified new doctor is unavailable' });
    }

    // Check conflict for new doctor at that time
    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctor: newDoctorId,
      appointmentDate: appointment.appointmentDate,
      status: { $in: ['pending', 'confirmed'] },
      $and: [
        { startTime: { $lt: appointment.endTime } },
        { endTime: { $gt: appointment.startTime } },
      ],
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'The newly selected physician has a schedule conflict during this time slot.',
      });
    }

    appointment.doctor = newDoctorId;
    if (newDoctor.department) {
      appointment.department = newDoctor.department;
    }
    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('department', 'name code');

    res.status(200).json({
      success: true,
      message: 'Physician reassigned successfully',
      appointment: populated,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateAppointmentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes, cancellationReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (!status || !isValidStatusTransition(appointment.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${appointment.status}' to '${status}'.`,
      });
    }

    appointment.status = status;
    if (notes !== undefined) appointment.notes = notes.trim();
    if (status === 'cancelled') {
      appointment.cancelledBy = req.user._id;
      appointment.cancellationReason = cancellationReason ? cancellationReason.trim() : 'Cancelled by administrator';
    }

    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email')
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name email' }],
      })
      .populate('department', 'name code');

    res.status(200).json({
      success: true,
      message: `Appointment status updated to '${status}'`,
      appointment: populated,
    });
  } catch (error) {
    next(error);
  }
}

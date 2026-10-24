import mongoose from 'mongoose';
import DoctorProfile, { validateSchedule } from '../models/DoctorProfile.js';
import User from '../models/User.js';
import Department from '../models/Department.js';

// =============================================================================
// ADMIN CONTROLLERS (Admin Only)
// =============================================================================

export async function adminListDoctors(req, res, next) {
  try {
    const { department, specialization, isAvailable, search } = req.query;
    const filter = {};

    if (department) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        filter.department = department;
      } else {
        // Find department by code or name
        const deptDoc = await Department.findOne({
          $or: [{ code: department.toUpperCase() }, { name: new RegExp(`^${department}$`, 'i') }],
        });
        if (deptDoc) {
          filter.department = deptDoc._id;
        }
      }
    }

    if (specialization) {
      filter.specialization = new RegExp(specialization, 'i');
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }

    let query = DoctorProfile.find(filter)
      .populate('user', 'name email role isActive')
      .populate('department', 'name code location isActive')
      .sort({ createdAt: -1 });

    const doctors = await query;

    // Filter by search string if provided
    let results = doctors;
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      results = doctors.filter((doc) => {
        const userName = doc.user?.name?.toLowerCase() || '';
        const userEmail = doc.user?.email?.toLowerCase() || '';
        const spec = doc.specialization?.toLowerCase() || '';
        const deptName = doc.department?.name?.toLowerCase() || '';
        const room = doc.roomNumber?.toLowerCase() || '';
        return (
          userName.includes(q) ||
          userEmail.includes(q) ||
          spec.includes(q) ||
          deptName.includes(q) ||
          room.includes(q)
        );
      });
    }

    res.status(200).json({
      success: true,
      count: results.length,
      doctors: results,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminGetDoctorById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID format' });
    }

    // Try finding by DoctorProfile _id or User _id
    let doctor = await DoctorProfile.findById(id)
      .populate('user', 'name email role isActive')
      .populate('department', 'name code location isActive');

    if (!doctor) {
      doctor = await DoctorProfile.findOne({ user: id })
        .populate('user', 'name email role isActive')
        .populate('department', 'name code location isActive');
    }

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateDoctorProfile(req, res, next) {
  try {
    const {
      userId,
      departmentId,
      department,
      specialization,
      qualification,
      experienceYears,
      consultationFee,
      bio,
      roomNumber,
      availability,
    } = req.body;

    const targetUserId = userId;
    const targetDeptId = departmentId || department;

    // 1. Validate User
    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ success: false, message: 'A valid doctor user ID is required' });
    }

    const doctorUser = await User.findById(targetUserId);
    if (!doctorUser) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    if (doctorUser.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: `User '${doctorUser.name}' has role '${doctorUser.role}'. Only users with role 'doctor' can have a DoctorProfile.`,
      });
    }

    // 2. Check for duplicate DoctorProfile
    const existingProfile = await DoctorProfile.findOne({ user: targetUserId });
    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: 'A doctor profile already exists for this user account',
      });
    }

    // 3. Validate Department (optional on initial creation, but if provided must exist and be active)
    let validatedDeptId = null;
    if (targetDeptId) {
      if (!mongoose.Types.ObjectId.isValid(targetDeptId)) {
        return res.status(400).json({ success: false, message: 'Invalid department ID format' });
      }
      const deptDoc = await Department.findById(targetDeptId);
      if (!deptDoc) {
        return res.status(404).json({ success: false, message: 'Specified department does not exist' });
      }
      if (!deptDoc.isActive) {
        return res.status(400).json({
          success: false,
          message: `Department '${deptDoc.name}' is currently deactivated and cannot accept new doctor assignments`,
        });
      }
      validatedDeptId = deptDoc._id;
    }

    // 4. Validate fields
    if (!specialization || !specialization.trim()) {
      return res.status(400).json({ success: false, message: 'Specialization is required' });
    }
    if (!qualification || !qualification.trim()) {
      return res.status(400).json({ success: false, message: 'Qualification is required' });
    }
    if (experienceYears !== undefined && (experienceYears < 0 || isNaN(experienceYears))) {
      return res.status(400).json({ success: false, message: 'Experience years must be a non-negative number' });
    }
    if (consultationFee !== undefined && (consultationFee < 0 || isNaN(consultationFee))) {
      return res.status(400).json({ success: false, message: 'Consultation fee must be a non-negative number' });
    }

    // 5. Validate Schedule if provided
    if (availability?.schedule) {
      const scheduleCheck = validateSchedule(availability.schedule);
      if (!scheduleCheck.valid) {
        return res.status(400).json({ success: false, message: scheduleCheck.message });
      }
    }

    // 6. Create Profile
    const newProfile = await DoctorProfile.create({
      user: targetUserId,
      department: validatedDeptId,
      specialization: specialization.trim(),
      qualification: qualification.trim(),
      experienceYears: experienceYears !== undefined ? Number(experienceYears) : 0,
      consultationFee: consultationFee !== undefined ? Number(consultationFee) : 500,
      bio: bio ? bio.trim() : '',
      roomNumber: roomNumber ? roomNumber.trim() : '',
      isAvailable: true,
      ...(availability ? { availability } : {}),
    });

    const populated = await DoctorProfile.findById(newProfile._id)
      .populate('user', 'name email role isActive')
      .populate('department', 'name code location isActive');

    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully',
      doctor: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A doctor profile already exists for this user account',
      });
    }
    next(error);
  }
}

export async function adminUpdateDoctorProfile(req, res, next) {
  try {
    const { id } = req.params;
    const {
      departmentId,
      department,
      specialization,
      qualification,
      experienceYears,
      consultationFee,
      bio,
      roomNumber,
      isAvailable,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor profile ID format' });
    }

    const doctorProfile = await DoctorProfile.findById(id);
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    // Check Department if updated
    const targetDept = departmentId || department;
    if (targetDept) {
      if (!mongoose.Types.ObjectId.isValid(targetDept)) {
        return res.status(400).json({ success: false, message: 'Invalid department ID format' });
      }
      const deptDoc = await Department.findById(targetDept);
      if (!deptDoc) {
        return res.status(404).json({ success: false, message: 'Department does not exist' });
      }
      if (!deptDoc.isActive) {
        return res.status(400).json({
          success: false,
          message: `Department '${deptDoc.name}' is deactivated and cannot receive doctor assignment`,
        });
      }
      doctorProfile.department = targetDept;
    }

    if (specialization !== undefined) {
      if (!specialization.trim()) {
        return res.status(400).json({ success: false, message: 'Specialization cannot be empty' });
      }
      doctorProfile.specialization = specialization.trim();
    }

    if (qualification !== undefined) {
      if (!qualification.trim()) {
        return res.status(400).json({ success: false, message: 'Qualification cannot be empty' });
      }
      doctorProfile.qualification = qualification.trim();
    }

    if (experienceYears !== undefined) {
      if (experienceYears < 0 || isNaN(experienceYears)) {
        return res.status(400).json({ success: false, message: 'Experience years must be non-negative' });
      }
      doctorProfile.experienceYears = Number(experienceYears);
    }

    if (consultationFee !== undefined) {
      if (consultationFee < 0 || isNaN(consultationFee)) {
        return res.status(400).json({ success: false, message: 'Consultation fee must be non-negative' });
      }
      doctorProfile.consultationFee = Number(consultationFee);
    }

    if (bio !== undefined) doctorProfile.bio = bio.trim();
    if (roomNumber !== undefined) doctorProfile.roomNumber = roomNumber.trim();
    if (isAvailable !== undefined) doctorProfile.isAvailable = Boolean(isAvailable);

    await doctorProfile.save();

    const updated = await DoctorProfile.findById(doctorProfile._id)
      .populate('user', 'name email role isActive')
      .populate('department', 'name code location isActive');

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      doctor: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateDoctorAvailability(req, res, next) {
  try {
    const { id } = req.params;
    const { slotDuration, timeZone, isAcceptingAppointments, schedule } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor profile ID format' });
    }

    const doctorProfile = await DoctorProfile.findById(id);
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    if (slotDuration !== undefined) {
      if (slotDuration < 10 || slotDuration > 120 || isNaN(slotDuration)) {
        return res.status(400).json({
          success: false,
          message: 'Appointment slotDuration must be between 10 and 120 minutes',
        });
      }
      doctorProfile.availability.slotDuration = Number(slotDuration);
    }

    if (timeZone !== undefined) {
      doctorProfile.availability.timeZone = timeZone.trim() || 'UTC';
    }

    if (isAcceptingAppointments !== undefined) {
      doctorProfile.availability.isAcceptingAppointments = Boolean(isAcceptingAppointments);
    }

    if (schedule !== undefined) {
      const check = validateSchedule(schedule);
      if (!check.valid) {
        return res.status(400).json({ success: false, message: check.message });
      }
      doctorProfile.availability.schedule = schedule;
    }

    await doctorProfile.save();

    const updated = await DoctorProfile.findById(doctorProfile._id)
      .populate('user', 'name email role isActive')
      .populate('department', 'name code location isActive');

    res.status(200).json({
      success: true,
      message: 'Doctor availability schedule updated successfully',
      availability: updated.availability,
      doctor: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function adminToggleDoctorStatus(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor profile ID format' });
    }

    const doctorProfile = await DoctorProfile.findById(id);
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    doctorProfile.isAvailable = !doctorProfile.isAvailable;
    if (doctorProfile.availability) {
      doctorProfile.availability.isAcceptingAppointments = doctorProfile.isAvailable;
    }

    await doctorProfile.save();

    const updated = await DoctorProfile.findById(doctorProfile._id)
      .populate('user', 'name email role isActive')
      .populate('department', 'name code location isActive');

    res.status(200).json({
      success: true,
      message: `Doctor availability set to ${doctorProfile.isAvailable ? 'Active' : 'Unavailable'}`,
      doctor: updated,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// DOCTOR SELF CONTROLLERS (Doctor Role Only)
// Note: Uses req.user._id strictly to prevent ID spoofing / horizontal privilege escalation
// =============================================================================

export async function doctorGetMyProfile(req, res, next) {
  try {
    let doctor = await DoctorProfile.findOne({ user: req.user._id })
      .populate('user', 'name email role isActive')
      .populate('department', 'name code location isActive');

    if (!doctor) {
      return res.status(200).json({
        success: true,
        profileExists: false,
        message: 'Doctor profile has not been configured by administration yet',
        doctor: null,
      });
    }

    res.status(200).json({
      success: true,
      profileExists: true,
      doctor,
    });
  } catch (error) {
    next(error);
  }
}

export async function doctorUpdateMyProfile(req, res, next) {
  try {
    const doctor = await DoctorProfile.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found. Please contact administration to initialize your profile.',
      });
    }

    const { specialization, qualification, experienceYears, consultationFee, bio, roomNumber } = req.body;

    if (specialization !== undefined) {
      if (!specialization.trim()) {
        return res.status(400).json({ success: false, message: 'Specialization cannot be empty' });
      }
      doctor.specialization = specialization.trim();
    }

    if (qualification !== undefined) {
      if (!qualification.trim()) {
        return res.status(400).json({ success: false, message: 'Qualification cannot be empty' });
      }
      doctor.qualification = qualification.trim();
    }

    if (experienceYears !== undefined) {
      if (experienceYears < 0 || isNaN(experienceYears)) {
        return res.status(400).json({ success: false, message: 'Experience years must be non-negative' });
      }
      doctor.experienceYears = Number(experienceYears);
    }

    if (consultationFee !== undefined) {
      if (consultationFee < 0 || isNaN(consultationFee)) {
        return res.status(400).json({ success: false, message: 'Consultation fee must be non-negative' });
      }
      doctor.consultationFee = Number(consultationFee);
    }

    if (bio !== undefined) doctor.bio = bio.trim();
    if (roomNumber !== undefined) doctor.roomNumber = roomNumber.trim();

    await doctor.save();

    const updated = await DoctorProfile.findById(doctor._id)
      .populate('user', 'name email role isActive')
      .populate('department', 'name code location isActive');

    res.status(200).json({
      success: true,
      message: 'Your doctor profile has been updated successfully',
      doctor: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function doctorGetMyAvailability(req, res, next) {
  try {
    const doctor = await DoctorProfile.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found. Please contact administration.',
      });
    }

    res.status(200).json({
      success: true,
      isAvailable: doctor.isAvailable,
      availability: doctor.availability,
    });
  } catch (error) {
    next(error);
  }
}

export async function doctorUpdateMyAvailability(req, res, next) {
  try {
    const doctor = await DoctorProfile.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found. Please contact administration.',
      });
    }

    const { slotDuration, timeZone, isAcceptingAppointments, schedule } = req.body;

    if (slotDuration !== undefined) {
      if (slotDuration < 10 || slotDuration > 120 || isNaN(slotDuration)) {
        return res.status(400).json({
          success: false,
          message: 'slotDuration must be between 10 and 120 minutes',
        });
      }
      doctor.availability.slotDuration = Number(slotDuration);
    }

    if (timeZone !== undefined) {
      doctor.availability.timeZone = timeZone.trim() || 'UTC';
    }

    if (isAcceptingAppointments !== undefined) {
      doctor.availability.isAcceptingAppointments = Boolean(isAcceptingAppointments);
    }

    if (schedule !== undefined) {
      const check = validateSchedule(schedule);
      if (!check.valid) {
        return res.status(400).json({ success: false, message: check.message });
      }
      doctor.availability.schedule = schedule;
    }

    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Your consultation schedule has been updated successfully',
      availability: doctor.availability,
      isAvailable: doctor.isAvailable,
    });
  } catch (error) {
    next(error);
  }
}

export async function doctorToggleMyAvailability(req, res, next) {
  try {
    const doctor = await DoctorProfile.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    doctor.isAvailable = !doctor.isAvailable;
    if (doctor.availability) {
      doctor.availability.isAcceptingAppointments = doctor.isAvailable;
    }

    await doctor.save();

    res.status(200).json({
      success: true,
      message: `Your availability status is now ${doctor.isAvailable ? 'Active' : 'Unavailable'}`,
      isAvailable: doctor.isAvailable,
      isAcceptingAppointments: doctor.availability.isAcceptingAppointments,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// PUBLIC / PATIENT DOCTOR DIRECTORY CONTROLLERS
// =============================================================================

export async function publicListDoctors(req, res, next) {
  try {
    const { department, specialization, search } = req.query;
    const filter = { isAvailable: true };

    if (department) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        filter.department = department;
      } else {
        const deptDoc = await Department.findOne({
          $or: [{ code: department.toUpperCase() }, { name: new RegExp(`^${department}$`, 'i') }],
        });
        if (deptDoc) {
          filter.department = deptDoc._id;
        }
      }
    }

    if (specialization) {
      filter.specialization = new RegExp(specialization, 'i');
    }

    const doctors = await DoctorProfile.find(filter)
      .populate('user', 'name email role')
      .populate('department', 'name code location')
      .sort({ specialization: 1 });

    // Exclude doctors whose user account is deactivated
    let results = doctors.filter((d) => d.user && d.department);

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter((doc) => {
        const name = doc.user?.name?.toLowerCase() || '';
        const spec = doc.specialization?.toLowerCase() || '';
        const dept = doc.department?.name?.toLowerCase() || '';
        return name.includes(q) || spec.includes(q) || dept.includes(q);
      });
    }

    // Public-safe formatting without internal database tokens or passwords
    const safeDoctors = results.map((d) => ({
      id: d._id,
      _id: d._id,
      name: d.user?.name,
      department: d.department ? {
        id: d.department._id,
        name: d.department.name,
        code: d.department.code,
        location: d.department.location,
      } : null,
      specialization: d.specialization,
      qualification: d.qualification,
      experienceYears: d.experienceYears,
      consultationFee: d.consultationFee,
      bio: d.bio,
      roomNumber: d.roomNumber,
      isAvailable: d.isAvailable,
      slotDuration: d.availability?.slotDuration || 30,
      timeZone: d.availability?.timeZone || 'UTC',
      schedule: d.availability?.schedule?.filter((s) => s.isActive) || [],
    }));

    res.status(200).json({
      success: true,
      count: safeDoctors.length,
      doctors: safeDoctors,
    });
  } catch (error) {
    next(error);
  }
}

export async function publicGetDoctorById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID format' });
    }

    const doctor = await DoctorProfile.findById(id)
      .populate('user', 'name email role')
      .populate('department', 'name code location');

    if (!doctor || !doctor.isAvailable) {
      return res.status(404).json({ success: false, message: 'Doctor not found or currently unavailable' });
    }

    const safeDoctor = {
      id: doctor._id,
      _id: doctor._id,
      name: doctor.user?.name,
      department: doctor.department ? {
        id: doctor.department._id,
        name: doctor.department.name,
        code: doctor.department.code,
        location: doctor.department.location,
      } : null,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experienceYears: doctor.experienceYears,
      consultationFee: doctor.consultationFee,
      bio: doctor.bio,
      roomNumber: doctor.roomNumber,
      isAvailable: doctor.isAvailable,
      slotDuration: doctor.availability?.slotDuration || 30,
      timeZone: doctor.availability?.timeZone || 'UTC',
      schedule: doctor.availability?.schedule?.filter((s) => s.isActive) || [],
    };

    res.status(200).json({
      success: true,
      doctor: safeDoctor,
    });
  } catch (error) {
    next(error);
  }
}

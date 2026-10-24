import mongoose from 'mongoose';

const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function validateSchedule(schedule) {
  if (!Array.isArray(schedule)) {
    return { valid: false, message: 'Schedule must be an array of day entries' };
  }

  const seenDays = new Set();
  for (const entry of schedule) {
    if (!entry.day || !VALID_DAYS.includes(entry.day.toLowerCase().trim())) {
      return { valid: false, message: `Invalid day of week: '${entry.day}'. Allowed days: ${VALID_DAYS.join(', ')}` };
    }

    const day = entry.day.toLowerCase().trim();
    if (seenDays.has(day)) {
      return { valid: false, message: `Duplicate day entry in schedule: '${day}'` };
    }
    seenDays.add(day);

    if (!entry.startTime || !entry.endTime) {
      return { valid: false, message: `Both startTime and endTime are required for ${day}` };
    }

    // HH:mm 24-hour time format check
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(entry.startTime)) {
      return { valid: false, message: `Invalid startTime '${entry.startTime}' for ${day}. Expected HH:mm format` };
    }
    if (!timeRegex.test(entry.endTime)) {
      return { valid: false, message: `Invalid endTime '${entry.endTime}' for ${day}. Expected HH:mm format` };
    }

    if (entry.startTime >= entry.endTime) {
      return { valid: false, message: `End time (${entry.endTime}) must be strictly after start time (${entry.startTime}) for ${day}` };
    }

    // Optional break interval verification
    if (entry.breakStart || entry.breakEnd) {
      if (!entry.breakStart || !entry.breakEnd) {
        return { valid: false, message: `Both breakStart and breakEnd must be specified if a break is configured for ${day}` };
      }
      if (!timeRegex.test(entry.breakStart)) {
        return { valid: false, message: `Invalid breakStart '${entry.breakStart}' for ${day}` };
      }
      if (!timeRegex.test(entry.breakEnd)) {
        return { valid: false, message: `Invalid breakEnd '${entry.breakEnd}' for ${day}` };
      }
      if (entry.breakStart >= entry.breakEnd) {
        return { valid: false, message: `breakEnd (${entry.breakEnd}) must be after breakStart (${entry.breakStart}) for ${day}` };
      }
      if (entry.breakStart < entry.startTime || entry.breakEnd > entry.endTime) {
        return { valid: false, message: `Break period (${entry.breakStart} - ${entry.breakEnd}) must be within working hours (${entry.startTime} - ${entry.endTime}) for ${day}` };
      }
    }
  }

  return { valid: true };
}

const dayScheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      enum: {
        values: VALID_DAYS,
        message: 'Day must be one of monday, tuesday, wednesday, thursday, friday, saturday, sunday',
      },
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    breakStart: {
      type: String,
      default: '',
      trim: true,
    },
    breakEnd: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    slotDuration: {
      type: Number,
      default: 30, // 30 minutes default per appointment slot
      min: [10, 'slotDuration must be at least 10 minutes'],
      max: [120, 'slotDuration cannot exceed 120 minutes'],
    },
    timeZone: {
      type: String,
      default: 'UTC',
      trim: true,
    },
    isAcceptingAppointments: {
      type: Boolean,
      default: true,
    },
    schedule: {
      type: [dayScheduleSchema],
      default: () => [
        { day: 'monday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
        { day: 'tuesday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
        { day: 'wednesday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
        { day: 'thursday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
        { day: 'friday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
      ],
    },
  },
  { _id: false }
);

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Associated User reference is required'],
      unique: true,
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
      minlength: [2, 'Specialization must be at least 2 characters long'],
      maxlength: [100, 'Specialization cannot exceed 100 characters'],
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: [0, 'Experience years cannot be negative'],
      max: [70, 'Experience years cannot exceed 70'],
    },
    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
      minlength: [2, 'Qualification must be at least 2 characters long'],
      maxlength: [200, 'Qualification cannot exceed 200 characters'],
    },
    consultationFee: {
      type: Number,
      default: 500,
      min: [0, 'Consultation fee cannot be negative'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
      default: '',
    },
    roomNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Room number cannot exceed 50 characters'],
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    availability: {
      type: availabilitySchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Pre-save validation for availability schedule
doctorProfileSchema.pre('validate', function (next) {
  if (this.availability && this.availability.schedule && this.availability.schedule.length > 0) {
    const result = validateSchedule(this.availability.schedule);
    if (!result.valid) {
      return next(new Error(result.message));
    }
  }
  next();
});

const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);

export { VALID_DAYS };
export default DoctorProfile;

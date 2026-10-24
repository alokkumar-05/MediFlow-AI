import mongoose from 'mongoose';

export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

// Valid status transitions
export const ALLOWED_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [], // terminal
  cancelled: [], // terminal
  no_show: [],   // terminal
};

export function isValidStatusTransition(currentStatus, nextStatus) {
  if (['completed', 'cancelled', 'no_show'].includes(currentStatus)) {
    return false;
  }
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  return Array.isArray(allowed) && allowed.includes(nextStatus);
}

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: [true, 'Doctor reference is required'],
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
      index: true,
    },
    appointmentDate: {
      type: String, // Stored as YYYY-MM-DD for deterministic calendar matching
      required: [true, 'Appointment date (YYYY-MM-DD) is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Appointment date must be in YYYY-MM-DD format'],
      index: true,
    },
    startTime: {
      type: String, // HH:mm 24-hour format
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'startTime must be in HH:mm 24-hour format'],
    },
    endTime: {
      type: String, // HH:mm 24-hour format
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'endTime must be in HH:mm 24-hour format'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for consultation is required'],
      trim: true,
      minlength: [2, 'Reason must be at least 2 characters'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: APPOINTMENT_STATUSES,
        message: 'Invalid appointment status',
      },
      default: 'pending',
      index: true,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
    },
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
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

// Index to optimize conflict lookups and doctor schedules
appointmentSchema.index({ doctor: 1, appointmentDate: 1, status: 1 });
appointmentSchema.index({ patient: 1, appointmentDate: 1, status: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;

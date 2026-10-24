import mongoose from 'mongoose';

export const ADMISSION_STATUSES = ['admitted', 'discharged', 'cancelled'];

export function isValidAdmissionStatusTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) return false;
  // Terminal states cannot be changed
  if (['discharged', 'cancelled'].includes(currentStatus)) return false;
  if (currentStatus === 'admitted' && ['discharged', 'cancelled'].includes(nextStatus)) {
    return true;
  }
  return false;
}

const admissionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    attendingDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: [true, 'Attending physician reference is required'],
      index: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Hospital department reference is required'],
      index: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    admissionReason: {
      type: String,
      required: [true, 'Admission reason is required'],
      trim: true,
      maxlength: [500, 'Admission reason cannot exceed 500 characters'],
    },
    bedNumber: {
      type: String,
      required: [true, 'Bed or room identifier is required'],
      trim: true,
      maxlength: [50, 'Bed identifier cannot exceed 50 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ADMISSION_STATUSES,
        message: 'Invalid admission status: {VALUE}',
      },
      default: 'admitted',
      index: true,
    },
    dischargeDate: {
      type: Date,
      default: null,
    },
    dischargeSummary: {
      type: String,
      trim: true,
      maxlength: [2000, 'Discharge summary cannot exceed 2000 characters'],
      default: '',
    },
    treatmentSummary: {
      type: String,
      trim: true,
      maxlength: [2000, 'Treatment summary cannot exceed 2000 characters'],
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    admittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admitting staff member reference is required'],
    },
    dischargedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for active queries and history
admissionSchema.index({ patient: 1, status: 1 });
admissionSchema.index({ attendingDoctor: 1, status: 1 });
admissionSchema.index({ department: 1, status: 1 });

const Admission = mongoose.model('Admission', admissionSchema);

export default Admission;

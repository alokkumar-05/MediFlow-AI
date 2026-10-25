import mongoose from 'mongoose';

export const RECORD_TYPES = [
  'consultation',
  'diagnosis',
  'prescription',
  'lab_report',
  'imaging',
  'treatment',
  'nursing_observation',
  'other',
];

const prescriptionSchema = new mongoose.Schema(
  {
    medicationName: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
      maxlength: [150, 'Medication name cannot exceed 150 characters'],
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true,
      maxlength: [100, 'Dosage cannot exceed 100 characters'],
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      trim: true,
      maxlength: [100, 'Frequency cannot exceed 100 characters'],
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
      maxlength: [100, 'Duration cannot exceed 100 characters'],
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Instructions cannot exceed 500 characters'],
      default: '',
    },
  },
  { _id: true }
);

const vitalsSchema = new mongoose.Schema(
  {
    bloodPressure: { type: String, trim: true, default: '' },
    heartRate: { type: String, trim: true, default: '' },
    temperature: { type: String, trim: true, default: '' },
    oxygenSaturation: { type: String, trim: true, default: '' },
    respiratoryRate: { type: String, trim: true, default: '' },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const medicalRecordSchema = new mongoose.Schema(
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
      default: null,
      index: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
      index: true,
    },
    recordType: {
      type: String,
      required: [true, 'Record type is required'],
      enum: {
        values: RECORD_TYPES,
        message: 'Invalid record type: {VALUE}',
      },
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Record title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    diagnosis: {
      type: String,
      trim: true,
      default: '',
    },
    symptoms: {
      type: [String],
      default: [],
    },
    treatment: {
      type: String,
      trim: true,
      default: '',
    },
    prescriptions: {
      type: [prescriptionSchema],
      default: [],
    },
    vitals: {
      type: vitalsSchema,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    reportFile: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      fileName: { type: String, default: null },
      fileType: { type: String, default: null },
      fileSize: { type: Number, default: null },
      uploadedAt: { type: Date, default: null },
    },
    aiAnalysis: {
      reportType: { type: String, default: null },
      reportDate: { type: String, default: null },
      keyFindings: { type: [String], default: [] },
      testResults: [
        {
          testName: { type: String, default: '' },
          value: { type: String, default: '' },
          unit: { type: String, default: '' },
          referenceRange: { type: String, default: '' },
          flag: { type: String, enum: ['normal', 'high', 'low', 'positive', 'negative', 'indeterminate', 'abnormal', null], default: null },
        },
      ],
      valuesMarkedAbnormal: { type: [String], default: [] },
      plainLanguageSummary: { type: String, default: '' },
      doctorDiscussionQuestions: { type: [String], default: [] },
      unreadableOrMissingInfo: { type: String, default: '' },
      disclaimer: { type: String, default: '' },
      modelUsed: { type: String, default: null },
      analyzedAt: { type: Date, default: null },
    },
    recordDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedReason: {
      type: String,
      trim: true,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

medicalRecordSchema.index({ patient: 1, recordDate: -1 });
medicalRecordSchema.index({ patient: 1, recordType: 1 });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;

import mongoose from 'mongoose';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Admission from '../models/Admission.js';
import Appointment from '../models/Appointment.js';
import Department from '../models/Department.js';
import { generatePatientHistorySummary, buildGroundedFallbackSummary } from '../services/geminiService.js';
import { config } from '../config/env.js';

export async function generatePatientSummary(req, res, next) {
  try {
    const { patientId } = req.params;

    // 1. Validate Patient ID format
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patientId format.',
      });
    }

    // 2. Validate Doctor Role & Profile
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only authenticated physicians may generate AI patient history summaries.',
      });
    }

    const doctorProfile = await DoctorProfile.findOne({ user: req.user._id });
    if (!doctorProfile) {
      return res.status(403).json({
        success: false,
        message: 'Doctor clinical profile not found for authenticated user.',
      });
    }

    // 3. Locate Target Patient
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient record not found.',
      });
    }

    // 4. Verify Doctor-Patient Relationship / Authorization
    const [hasAppointment, hasAdmission, hasRecord] = await Promise.all([
      Appointment.exists({ doctor: doctorProfile._id, patient: patientId }),
      Admission.exists({ attendingDoctor: doctorProfile._id, patient: patientId }),
      MedicalRecord.exists({ doctor: doctorProfile._id, patient: patientId }),
    ]);

    if (!hasAppointment && !hasAdmission && !hasRecord) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are only authorized to generate clinical summaries for patients assigned to your care or with documented encounters.',
      });
    }

    // 5. Retrieve Documented Records for Patient (Audit-Friendly: Non-Archived only)
    const [records, admissions] = await Promise.all([
      MedicalRecord.find({ patient: patientId, isArchived: false }).sort({ recordDate: 1 }),
      Admission.find({ patient: patientId }).populate('department', 'name code').sort({ admissionDate: 1 }),
    ]);

    // 6. Handle Missing AI Configuration
    // If AI is not configured, check if client specifically requested fallback or return 503
    if (!config.geminiApiKey) {
      if (req.query.allowFallback === 'true') {
        const fallback = buildGroundedFallbackSummary(patient, records, admissions);
        return res.status(200).json({
          success: true,
          patient: {
            id: patient._id,
            name: patient.name,
            email: patient.email,
          },
          generatedAt: new Date().toISOString(),
          disclaimer: 'This summary is generated from documented hospital records for clinical review only and does not constitute a formal diagnosis or medical advice.',
          summary: {
            sections: fallback.sections,
            rawText: fallback.rawText,
            modelUsed: 'grounded-fallback',
            isFallback: true,
          },
          sources: {
            medicalRecordsCount: records.length,
            admissionsCount: admissions.length,
          },
        });
      }

      return res.status(503).json({
        success: false,
        message: 'AI summary provider is not configured. Missing GEMINI_API_KEY in environment configuration.',
      });
    }

    // 7. Invoke Gemini AI Patient History Summary Service
    try {
      const result = await generatePatientHistorySummary(patient, records, admissions, {
        timeoutMs: req.body?.timeoutMs || 30000,
      });

      return res.status(200).json({
        success: true,
        patient: {
          id: patient._id,
          name: patient.name,
          email: patient.email,
        },
        generatedAt: new Date().toISOString(),
        disclaimer: 'This summary is AI-generated from documented hospital records for clinical review only and does not constitute a formal diagnosis or medical advice.',
        summary: {
          sections: result.sections,
          rawText: result.rawText,
          modelUsed: result.modelUsed,
          isFallback: result.isFallback,
        },
        sources: {
          medicalRecordsCount: records.length,
          admissionsCount: admissions.length,
        },
      });
    } catch (aiError) {
      if (req.query.allowFallback === 'true') {
        const fallback = buildGroundedFallbackSummary(patient, records, admissions);
        return res.status(200).json({
          success: true,
          patient: {
            id: patient._id,
            name: patient.name,
            email: patient.email,
          },
          generatedAt: new Date().toISOString(),
          disclaimer: 'This summary is generated from documented hospital records for clinical review only and does not constitute a formal diagnosis or medical advice.',
          summary: {
            sections: fallback.sections,
            rawText: fallback.rawText,
            modelUsed: 'grounded-fallback',
            isFallback: true,
          },
          sources: {
            medicalRecordsCount: records.length,
            admissionsCount: admissions.length,
          },
        });
      }

      // Handle timeout specifically
      if (aiError.message && aiError.message.includes('timed out')) {
        return res.status(504).json({
          success: false,
          message: 'AI summary request timed out. Please try again.',
        });
      }

      // Handle AI provider failures gracefully without leaking API keys
      return res.status(502).json({
        success: false,
        message: 'AI summary provider error. Unable to generate summary at this time.',
      });
    }
  } catch (error) {
    next(error);
  }
}

export default {
  generatePatientSummary,
};

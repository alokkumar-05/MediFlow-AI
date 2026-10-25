import mongoose from 'mongoose';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Appointment from '../models/Appointment.js';
import Admission from '../models/Admission.js';
import { analyzeMedicalReport } from '../services/geminiService.js';
import { config } from '../config/env.js';

// Allowed mime types for medical report analysis
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'text/plain',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

/**
 * Validates doctor-patient care relationship (via appointment, admission, or medical record)
 */
async function verifyDoctorPatientRelationship(doctorId, patientId) {
  const [hasAppointment, hasAdmission, hasRecord] = await Promise.all([
    Appointment.exists({ doctor: doctorId, patient: patientId }),
    Admission.exists({ attendingDoctor: doctorId, patient: patientId }),
    MedicalRecord.exists({ doctor: doctorId, patient: patientId }),
  ]);
  return Boolean(hasAppointment || hasAdmission || hasRecord);
}

/**
 * Doctor endpoint: Analyze an uploaded or existing medical report for an authorized patient
 * POST /api/doctor/patients/:patientId/analyze-report
 */
export async function doctorAnalyzeMedicalReport(req, res, next) {
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
        message: 'Forbidden: Only authenticated physicians may analyze medical reports.',
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

    // 4. Verify Doctor-Patient Relationship
    const isAuthorized = await verifyDoctorPatientRelationship(doctorProfile._id, patientId);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are only authorized to analyze reports for patients under your active clinical care.',
      });
    }

    // 5. Extract and Validate Report Input
    const {
      recordId,
      fileBase64,
      mimeType,
      fileName,
      textContent,
      saveToRecord = false,
      recordTitle,
    } = req.body;

    let targetMimeType = mimeType || 'application/pdf';
    let base64Payload = fileBase64 || null;
    let textPayload = textContent || null;
    let existingRecord = null;

    // If a recordId is supplied, fetch existing record and verify ownership
    if (recordId) {
      if (!mongoose.Types.ObjectId.isValid(recordId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid recordId format.',
        });
      }

      existingRecord = await MedicalRecord.findOne({
        _id: recordId,
        patient: patientId,
        isArchived: false,
      });

      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: 'Referenced medical record not found for this patient or has been archived.',
        });
      }

      // Check if existing record has reportFile or notes/description to analyze
      if (!base64Payload && !textPayload) {
        if (existingRecord.reportFile?.url) {
          // If already analyzed previously and no new payload
          if (existingRecord.aiAnalysis?.plainLanguageSummary) {
            return res.status(200).json({
              success: true,
              message: 'Retrieved existing report analysis.',
              patient: { id: patient._id, name: patient.name },
              analysis: existingRecord.aiAnalysis,
              recordId: existingRecord._id,
            });
          }
        }
        // Fall back to description or notes if text
        if (existingRecord.description || existingRecord.notes) {
          textPayload = `${existingRecord.title}\n${existingRecord.description}\n${existingRecord.notes}`;
        }
      }
    }

    // Handle data URL prefix if sent from frontend FileReader
    if (base64Payload && typeof base64Payload === 'string') {
      const match = base64Payload.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        targetMimeType = match[1];
        base64Payload = match[2];
      }
    }

    // Validate MIME Type
    if (base64Payload && !ALLOWED_MIME_TYPES.includes(targetMimeType)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported report format: '${targetMimeType}'. Supported formats: PDF, JPEG, PNG, WEBP, Plain Text.`,
      });
    }

    // Validate File Size
    if (base64Payload) {
      const approxSizeBytes = Math.ceil((base64Payload.length * 3) / 4);
      if (approxSizeBytes > MAX_FILE_SIZE_BYTES) {
        return res.status(413).json({
          success: false,
          message: 'Report file exceeds the 10MB size limit. Please upload a smaller document or image.',
        });
      }
    }

    // Validate that some content exists
    if (!base64Payload && (!textPayload || !textPayload.trim())) {
      return res.status(400).json({
        success: false,
        message: 'No readable report document, image, or text was provided for analysis.',
      });
    }

    // Check for empty/blank base64
    if (base64Payload && base64Payload.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Report file content is empty or unreadable.',
      });
    }

    // 6. Check Gemini configuration
    if (!config.geminiApiKey) {
      return res.status(503).json({
        success: false,
        message: 'AI medical report analysis service is not configured. Missing GEMINI_API_KEY in environment configuration.',
      });
    }

    // 7. Invoke Gemini Multimodal Analysis Service
    let result;
    try {
      result = await analyzeMedicalReport(
        {
          mimeType: targetMimeType,
          base64Data: base64Payload,
          textContent: textPayload,
        },
        { timeoutMs: req.body?.timeoutMs || 35000 }
      );
    } catch (aiError) {
      console.error('[Report Analysis Error]:', aiError?.message || aiError);
      if (aiError.message && aiError.message.includes('timed out')) {
        return res.status(504).json({
          success: false,
          message: 'AI report analysis timed out. Please try again with a clear single-page document or image.',
        });
      }

      return res.status(502).json({
        success: false,
        message: 'AI report analysis provider error. Unable to analyze report at this time.',
      });
    }

    // 8. Optionally persist analysis to existing or new MedicalRecord
    let savedRecord = existingRecord;
    if (saveToRecord) {
      const analysisData = {
        reportType: result.analysis.reportType,
        reportDate: result.analysis.reportDate,
        keyFindings: result.analysis.keyFindings || [],
        testResults: result.analysis.testResults || [],
        valuesMarkedAbnormal: result.analysis.valuesMarkedAbnormal || [],
        plainLanguageSummary: result.analysis.plainLanguageSummary || '',
        doctorDiscussionQuestions: result.analysis.doctorDiscussionQuestions || [],
        unreadableOrMissingInfo: result.analysis.unreadableOrMissingInfo || '',
        disclaimer: result.analysis.disclaimer,
        modelUsed: result.modelUsed,
        analyzedAt: new Date(),
      };

      if (existingRecord) {
        existingRecord.aiAnalysis = analysisData;
        existingRecord.updatedBy = req.user._id;
        await existingRecord.save();
        savedRecord = existingRecord;
      } else {
        savedRecord = await MedicalRecord.create({
          patient: patientId,
          doctor: doctorProfile._id,
          recordType: 'lab_report',
          title: recordTitle || result.analysis.reportType || 'AI Analyzed Medical Report',
          description: result.analysis.plainLanguageSummary || 'AI-analyzed diagnostic report',
          notes: result.analysis.keyFindings?.join('\n') || '',
          reportFile: {
            fileName: fileName || 'uploaded-report',
            fileType: targetMimeType,
            uploadedAt: new Date(),
          },
          aiAnalysis: analysisData,
          createdBy: req.user._id,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Medical report analyzed successfully.',
      patient: {
        id: patient._id,
        name: patient.name,
      },
      analysis: result.analysis,
      modelUsed: result.modelUsed,
      analyzedAt: result.analyzedAt,
      recordId: savedRecord ? savedRecord._id : null,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Patient endpoint: Upload and analyze their own medical report
 * POST /api/patient/analyze-report
 */
export async function patientAnalyzeMedicalReport(req, res, next) {
  try {
    // 1. Verify Patient Role
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only authenticated patients may access this endpoint.',
      });
    }

    const patientId = req.user._id;

    // 2. Extract and Validate Input
    const {
      fileBase64,
      mimeType,
      textContent,
    } = req.body;

    let targetMimeType = mimeType || 'application/pdf';
    let base64Payload = fileBase64 || null;
    let textPayload = textContent || null;

    if (base64Payload && typeof base64Payload === 'string') {
      const match = base64Payload.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        targetMimeType = match[1];
        base64Payload = match[2];
      }
    }

    // Validate MIME Type
    if (base64Payload && !ALLOWED_MIME_TYPES.includes(targetMimeType)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported report format: '${targetMimeType}'. Supported formats: PDF, JPEG, PNG, WEBP, Plain Text.`,
      });
    }

    // Validate File Size
    if (base64Payload) {
      const approxSizeBytes = Math.ceil((base64Payload.length * 3) / 4);
      if (approxSizeBytes > MAX_FILE_SIZE_BYTES) {
        return res.status(413).json({
          success: false,
          message: 'Report file exceeds the 10MB size limit. Please upload a smaller document or image.',
        });
      }
    }

    if (!base64Payload && (!textPayload || !textPayload.trim())) {
      return res.status(400).json({
        success: false,
        message: 'No readable report document, image, or text was provided for analysis.',
      });
    }

    if (!config.geminiApiKey) {
      return res.status(503).json({
        success: false,
        message: 'AI medical report analysis service is not configured. Missing GEMINI_API_KEY in environment configuration.',
      });
    }

    let result;
    try {
      result = await analyzeMedicalReport(
        {
          mimeType: targetMimeType,
          base64Data: base64Payload,
          textContent: textPayload,
        },
        { timeoutMs: req.body?.timeoutMs || 35000 }
      );
    } catch (aiError) {
      if (aiError.message && aiError.message.includes('timed out')) {
        return res.status(504).json({
          success: false,
          message: 'AI report analysis timed out. Please try again.',
        });
      }

      return res.status(502).json({
        success: false,
        message: 'AI report analysis provider error. Unable to analyze report at this time.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Medical report analyzed successfully.',
      analysis: result.analysis,
      modelUsed: result.modelUsed,
      analyzedAt: result.analyzedAt,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  doctorAnalyzeMedicalReport,
  patientAnalyzeMedicalReport,
};

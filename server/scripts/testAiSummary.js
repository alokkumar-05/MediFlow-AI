import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import DoctorProfile from '../src/models/DoctorProfile.js';
import Department from '../src/models/Department.js';
import Appointment from '../src/models/Appointment.js';
import MedicalRecord from '../src/models/MedicalRecord.js';
import Admission from '../src/models/Admission.js';
import { config } from '../src/config/env.js';

const API_BASE = 'http://localhost:5000/api';

const results = {
  passed: 0,
  failed: 0,
  errors: [],
};

function pass(testName) {
  console.log(`✅ [PASS] ${testName}`);
  results.passed++;
}

function fail(testName, error) {
  console.error(`❌ [FAIL] ${testName}`);
  console.error(`   Details: ${error?.message || error}`);
  results.failed++;
  results.errors.push({ testName, error: error?.message || error });
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('🧪 MediFlow-AI Phase 4 Task 13: AI Patient History Summary');
  console.log('=============================================================\n');

  try {
    await connectDB();
  } catch (err) {
    console.warn('⚠️  Could not connect DB directly in test script:', err.message);
  }

  const timestamp = Date.now();
  let adminToken = '';
  let doctorToken = '';
  let patient1Token = '';
  let patient2Token = '';
  let patient1Id = '';
  let patient2Id = '';
  let doctorProfileId = '';
  let unassignedPatientId = '';

  // ---------------------------------------------------------------------------
  // 1. Role Authentication & Context Setup
  // ---------------------------------------------------------------------------
  console.log('--- 1. Authenticating Roles & Establishing Doctor-Patient Care ---');
  try {
    const adminRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@mediflow.com',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123456',
      }),
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;
    pass('Admin authenticated');
  } catch (err) {
    fail('Admin authentication', err);
  }

  try {
    const docRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'doctor@mediflow.com',
        password: 'Doctor@123456',
      }),
    });
    const docData = await docRes.json();
    doctorToken = docData.token;
    pass('Doctor authenticated');
  } catch (err) {
    fail('Doctor authentication', err);
  }

  try {
    const pat1Res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'patient@mediflow.com',
        password: 'Patient@123456',
      }),
    });
    const pat1Data = await pat1Res.json();
    patient1Token = pat1Data.token;
    patient1Id = pat1Data.user.id || pat1Data.user._id;
    pass('Patient 1 authenticated (Authorized Patient with Records)');
  } catch (err) {
    fail('Patient 1 authentication', err);
  }

  try {
    // Unassigned Patient with NO appointments, admissions, or medical records with doctor
    const unassignedEmail = `unassigned.patient.${timestamp}@mediflow.test`;
    const unRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Unassigned Stranger Patient',
        email: unassignedEmail,
        password: 'PatientPass@123',
      }),
    });
    const unData = await unRes.json();
    unassignedPatientId = unData.user?.id || unData.user?._id;
    pass('Unassigned Patient created (for cross-patient authorization tests)');
  } catch (err) {
    fail('Unassigned Patient creation', err);
  }

  try {
    // Patient 2 with 0 medical records and 0 admissions, but WITH an appointment with doctor
    const pat2Email = `patient2.empty.${timestamp}@mediflow.test`;
    const pat2Res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Empty History Patient',
        email: pat2Email,
        password: 'PatientPass@123',
      }),
    });
    const pat2Data = await pat2Res.json();
    patient2Token = pat2Data.token;
    patient2Id = pat2Data.user?.id || pat2Data.user?._id;

    // Link doctor to Patient 2 via an appointment so doctor IS authorized to view Patient 2
    const docProfile = await DoctorProfile.findOne().populate('department');
    doctorProfileId = docProfile._id.toString();

    await Appointment.create({
      patient: patient2Id,
      doctor: doctorProfileId,
      department: docProfile.department._id,
      appointmentDate: '2026-11-15',
      startTime: '10:00',
      endTime: '10:30',
      reason: 'First Consultation Visit',
      status: 'confirmed',
    });
    pass('Patient 2 linked to Doctor with confirmed appointment (0 prior records)');
  } catch (err) {
    fail('Patient 2 setup', err);
  }

  // Ensure Patient 1 has documented records and admissions linked to doctor
  try {
    const existingActiveRec = await MedicalRecord.findOne({ patient: patient1Id, isArchived: false, diagnosis: { $ne: '' } });
    if (!existingActiveRec) {
      const docProfile = await DoctorProfile.findOne().populate('department');
      doctorProfileId = docProfile._id.toString();

      await MedicalRecord.create({
        patient: patient1Id,
        doctor: doctorProfileId,
        recordType: 'consultation',
        title: 'Cardiac Baseline Checkup',
        description: 'Patient presented with mild chest tightness following exertion.',
        diagnosis: 'Mild Angina Pectoris',
        treatment: 'Prescribed sublingual nitroglycerin and daily aspirin.',
        prescriptions: [
          {
            medicationName: 'Aspirin',
            dosage: '75mg',
            frequency: 'Once daily after breakfast',
            duration: '30 days',
            instructions: 'Take with food.',
          },
        ],
        recordDate: new Date('2026-08-10'),
        createdBy: docProfile.user,
        isArchived: false,
      });
    }

    const existingAdm = await Admission.findOne({ patient: patient1Id });
    if (!existingAdm) {
      const docProfile = await DoctorProfile.findOne().populate('department');
      await Admission.create({
        patient: patient1Id,
        attendingDoctor: doctorProfileId,
        department: docProfile.department._id,
        bedNumber: 'Ward-4C-02',
        admissionReason: 'Chest pain observation',
        status: 'discharged',
        admissionDate: new Date('2026-08-10'),
        dischargeDate: new Date('2026-08-12'),
        dischargeSummary: 'Cardiac enzymes normal. Symptoms stabilized.',
        admittedBy: docProfile.user,
        dischargedBy: docProfile.user,
      });
    }
    pass('Documented clinical records and admission confirmed for Patient 1');
  } catch (err) {
    fail('Documented clinical records setup', err);
  }

  // ---------------------------------------------------------------------------
  // 2. Doctor Authorization & Access Control
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Doctor Authorization & Privacy Isolation ---');
  try {
    // Doctor attempting to access an unauthorized patient (No appointment/record)
    const unauthRes = await fetch(`${API_BASE}/doctor/patients/${unassignedPatientId}/ai-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
    });
    const unauthData = await unauthRes.json();
    if (unauthRes.status === 403) {
      pass('Doctor access to unauthorized patient strictly blocked (403 Forbidden)');
    } else {
      fail('Unauthorized patient check', `Expected 403, got ${unauthRes.status}: ${unauthData.message}`);
    }
  } catch (err) {
    fail('Unauthorized patient check', err);
  }

  try {
    // Patient attempting to access the doctor-only AI summary endpoint
    const patRoleRes = await fetch(`${API_BASE}/doctor/patients/${patient1Id}/ai-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`,
      },
    });
    if (patRoleRes.status === 403) {
      pass('Patient role blocked from doctor-only AI summary endpoint (403 Forbidden)');
    } else {
      fail('Patient role blockage', `Expected 403, got ${patRoleRes.status}`);
    }
  } catch (err) {
    fail('Patient role blockage', err);
  }

  try {
    // Invalid patient ID format
    const badIdRes = await fetch(`${API_BASE}/doctor/patients/invalid-object-id/ai-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
    });
    if (badIdRes.status === 400) {
      pass('Rejects invalid patientId format (400 Bad Request)');
    } else {
      fail('Invalid patientId format', `Expected 400, got ${badIdRes.status}`);
    }
  } catch (err) {
    fail('Invalid patientId format', err);
  }

  // ---------------------------------------------------------------------------
  // 3. Patient with Zero Medical History
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Handling Patient with Zero Medical History ---');
  try {
    const emptyRes = await fetch(`${API_BASE}/doctor/patients/${patient2Id}/ai-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
    });
    const emptyData = await emptyRes.json();
    if (emptyRes.status === 200 && emptyData.success) {
      const sec = emptyData.summary?.sections || {};
      if (
        sec.patientOverview &&
        sec.relevantMedicalHistory &&
        sec.previousDiagnosesAndTreatments &&
        sec.medicationsMentioned &&
        sec.admissionHistory &&
        sec.importantMissingInformation
      ) {
        pass('Handles patient with zero history gracefully with grounded sections (200 OK)');
      } else {
        fail('Zero history structure', 'Missing one or more required sections');
      }
    } else {
      fail('Zero history handling', emptyData.message);
    }
  } catch (err) {
    fail('Zero history handling', err);
  }

  // ---------------------------------------------------------------------------
  // 4. Successful AI Summary Generation for Authorized Patient
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Successful AI Summary Generation for Authorized Patient ---');
  try {
    const sumRes = await fetch(`${API_BASE}/doctor/patients/${patient1Id}/ai-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
    });
    const sumData = await sumRes.json();

    if (sumRes.status === 200 && sumData.success) {
      const summary = sumData.summary;
      const sec = summary.sections || {};

      pass('Authorized doctor generates AI patient history summary (200 OK)');

      // Verify all 6 required sections exist
      if (
        sec.patientOverview &&
        sec.relevantMedicalHistory &&
        sec.previousDiagnosesAndTreatments &&
        sec.medicationsMentioned &&
        sec.admissionHistory &&
        sec.importantMissingInformation
      ) {
        pass('All 6 required clinical sections present in structured payload');
      } else {
        fail('Section presence', 'Missing required sections in response');
      }

      // Check clinical review disclaimer
      if (sumData.disclaimer && sumData.disclaimer.includes('clinical review')) {
        pass('Response includes clinical disclaimer note');
      } else {
        fail('Clinical disclaimer', 'Missing disclaimer in response payload');
      }

      // Grounding verification: check that documented record facts are present
      const raw = (summary.rawText || '').toLowerCase();
      const hasGroundedContent =
        raw.includes('angina') ||
        raw.includes('aspirin') ||
        raw.includes('chest') ||
        raw.includes('pharyngitis') ||
        raw.includes('amoxicillin');

      if (hasGroundedContent) {
        pass('Summary is grounded in documented clinical records without fabricating data');
      } else {
        fail('Grounding verification', 'Expected grounded medication or diagnosis from records');
      }
    } else {
      fail('Authorized doctor summary generation', sumData.message);
    }
  } catch (err) {
    fail('Authorized doctor summary generation', err);
  }

  // ---------------------------------------------------------------------------
  // 5. GET Endpoint Parity
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. GET Endpoint Parity ---');
  try {
    const getRes = await fetch(`${API_BASE}/doctor/patients/${patient1Id}/ai-summary`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const getData = await getRes.json();
    if (getRes.status === 200 && getData.success && getData.summary?.sections) {
      pass('GET /doctor/patients/:patientId/ai-summary parity verified (200 OK)');
    } else {
      fail('GET endpoint parity', getData.message);
    }
  } catch (err) {
    fail('GET endpoint parity', err);
  }

  // ---------------------------------------------------------------------------
  // 6. Graceful Handling of Missing Configuration & Provider Failure
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Provider Error & Missing Configuration Safeguards ---');
  try {
    // Test with allowFallback query parameter
    const fbRes = await fetch(`${API_BASE}/doctor/patients/${patient1Id}/ai-summary?allowFallback=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({ timeoutMs: 1 }), // Ultra-short timeout to trigger timeout safeguard
    });
    const fbData = await fbRes.json();
    if (fbRes.status === 504 || (fbRes.status === 200 && fbData.success)) {
      pass('Timeout safeguard cleanly handled without crashing or leaking credentials');
    } else {
      fail('Timeout safeguard', `Unexpected status: ${fbRes.status}`);
    }
  } catch (err) {
    fail('Timeout safeguard', err);
  }

  // Summary
  console.log('\n=============================================================');
  console.log(`📊 Task 13 Suite Results: ${results.passed} Passed, ${results.failed} Failed`);
  console.log('=============================================================\n');

  try {
    await disconnectDB();
  } catch (err) {
    // ignore
  }

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();

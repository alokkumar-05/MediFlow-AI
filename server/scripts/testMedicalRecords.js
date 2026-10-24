import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import DoctorProfile from '../src/models/DoctorProfile.js';
import MedicalRecord from '../src/models/MedicalRecord.js';

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
  console.log('🧪 MediFlow-AI Phase 3 Task 11: Medical Records & Prescriptions');
  console.log('=============================================================\n');

  try {
    await connectDB();
  } catch (err) {
    console.warn('⚠️  Could not connect DB directly in test script:', err.message);
  }

  const timestamp = Date.now();
  let adminToken = '';
  let doctorToken = '';
  let nurseToken = '';
  let patient1Token = '';
  let patient2Token = '';
  let patient1Id = '';
  let patient2Id = '';
  let createdRecordId = '';

  // ---------------------------------------------------------------------------
  // 1. Role Authentication
  // ---------------------------------------------------------------------------
  console.log('--- 1. Authenticating Roles ---');
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
    if (adminRes.status === 200 && adminData.token) {
      adminToken = adminData.token;
      pass('Admin authenticated');
    } else {
      fail('Admin authentication', adminData.message);
    }
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
    if (docRes.status === 200 && docData.token) {
      doctorToken = docData.token;
      pass('Doctor authenticated');
    } else {
      fail('Doctor authentication', docData.message);
    }
  } catch (err) {
    fail('Doctor authentication', err);
  }

  try {
    // Create dedicated Nurse via Admin Staff endpoint
    const nurseEmail = `nurse.${timestamp}@mediflow.com`;
    const nurseStaffRes = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Nurse Florence ${timestamp}`,
        email: nurseEmail,
        password: 'NursePass@123',
        role: 'nurse',
      }),
    });
    const nurseStaffData = await nurseStaffRes.json();

    const nurseLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: nurseEmail,
        password: 'NursePass@123',
      }),
    });
    const nurseLoginData = await nurseLoginRes.json();
    if (nurseLoginRes.status === 200 && nurseLoginData.token) {
      nurseToken = nurseLoginData.token;
      pass('Nurse created and authenticated');
    } else {
      fail('Nurse authentication', nurseLoginData.message);
    }
  } catch (err) {
    fail('Nurse creation/authentication', err);
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
    if (pat1Res.status === 200 && pat1Data.token) {
      patient1Token = pat1Data.token;
      patient1Id = pat1Data.user.id || pat1Data.user._id;
      pass('Patient 1 authenticated');
    } else {
      fail('Patient 1 authentication', pat1Data.message);
    }
  } catch (err) {
    fail('Patient 1 authentication', err);
  }

  try {
    const email = `patient2_rx_${timestamp}@mediflow.test`;
    const pat2Res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Second Patient RX',
        email,
        password: 'PatientPass@123',
      }),
    });
    const pat2Data = await pat2Res.json();
    if (pat2Res.status === 201 && pat2Data.token) {
      patient2Token = pat2Data.token;
      patient2Id = pat2Data.user.id || pat2Data.user._id;
      pass('Patient 2 registered and authenticated');
    } else {
      fail('Patient 2 registration', pat2Data.message);
    }
  } catch (err) {
    fail('Patient 2 registration', err);
  }

  // ---------------------------------------------------------------------------
  // 2. Doctor Medical Record Creation & Structured Prescriptions
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Doctor Medical Record Creation & Prescriptions ---');
  try {
    // Missing required prescription field (dosage missing)
    const badRxRes = await fetch(`${API_BASE}/doctor/medical-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        patientId: patient1Id,
        recordType: 'consultation',
        title: 'Initial General Consultation',
        diagnosis: 'Acute Viral Pharyngitis',
        prescriptions: [
          {
            medicationName: 'Amoxicillin',
            // dosage omitted!
            frequency: 'TDS',
            duration: '5 days',
          },
        ],
      }),
    });
    const badRxData = await badRxRes.json();
    if (badRxRes.status === 400) {
      pass('Rejects prescription missing required dosage field (400 Bad Request)');
    } else {
      fail('Rejection of incomplete prescription', badRxData.message);
    }
  } catch (err) {
    fail('Rejection of incomplete prescription', err);
  }

  try {
    // Invalid record type
    const badTypeRes = await fetch(`${API_BASE}/doctor/medical-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        patientId: patient1Id,
        recordType: 'invalid_type',
        title: 'Checkup',
      }),
    });
    const badTypeData = await badTypeRes.json();
    if (badTypeRes.status === 400) {
      pass('Rejects invalid recordType enum (400 Bad Request)');
    } else {
      fail('Rejection of invalid recordType', badTypeData.message);
    }
  } catch (err) {
    fail('Rejection of invalid recordType', err);
  }

  try {
    // Successful creation of consultation record with structured prescriptions
    const createRes = await fetch(`${API_BASE}/doctor/medical-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        patientId: patient1Id,
        recordType: 'consultation',
        title: 'ENT Clinical Examination',
        description: 'Patient presented with severe sore throat and mild fever for 3 days.',
        diagnosis: 'Acute Streptococcal Pharyngitis',
        symptoms: ['Sore throat', 'Fever', 'Difficulty swallowing'],
        treatment: 'Prescribed oral antibiotic regimen with analgesic support.',
        prescriptions: [
          {
            medicationName: 'Amoxicillin 500mg',
            dosage: '500mg',
            frequency: 'Every 8 hours (Three times daily)',
            duration: '7 days',
            instructions: 'Take after meals with water. Complete entire course.',
          },
          {
            medicationName: 'Paracetamol 650mg',
            dosage: '650mg',
            frequency: 'As needed every 6 hours',
            duration: '3 days',
            instructions: 'For pain and fever relief.',
          },
        ],
        notes: 'Follow up if symptoms do not improve within 48 hours.',
      }),
    });

    const createData = await createRes.json();
    if (createRes.status === 201 && createData.success) {
      createdRecordId = createData.record._id;
      pass('Doctor creates consultation record with structured prescriptions (201 Created)');
    } else {
      fail('Doctor creates consultation record', createData.message);
    }
  } catch (err) {
    fail('Doctor creates consultation record', err);
  }

  // ---------------------------------------------------------------------------
  // 3. Patient Medical Record Ownership & Privacy
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Patient Medical History & Data Isolation ---');
  try {
    const listRes = await fetch(`${API_BASE}/patient/medical-records`, {
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    const listData = await listRes.json();
    if (listRes.status === 200 && Array.isArray(listData.records)) {
      const found = listData.records.some((r) => r._id === createdRecordId);
      if (found) {
        pass('Patient 1 retrieves own medical records containing new record');
      } else {
        fail('Patient 1 retrieves own records', 'Created record not found in list');
      }
    } else {
      fail('Patient 1 retrieves own records', listData.message);
    }
  } catch (err) {
    fail('Patient 1 retrieves own records', err);
  }

  try {
    const detailRes = await fetch(`${API_BASE}/patient/medical-records/${createdRecordId}`, {
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    const detailData = await detailRes.json();
    if (detailRes.status === 200 && detailData.record?.title === 'ENT Clinical Examination') {
      pass('Patient 1 views own record details with structured prescriptions (200 OK)');
    } else {
      fail('Patient 1 views record details', detailData.message);
    }
  } catch (err) {
    fail('Patient 1 views record details', err);
  }

  try {
    // Cross-patient access test: Patient 2 tries to access Patient 1's record
    const crossRes = await fetch(`${API_BASE}/patient/medical-records/${createdRecordId}`, {
      headers: { Authorization: `Bearer ${patient2Token}` },
    });
    const crossData = await crossRes.json();
    if (crossRes.status === 403) {
      pass('Cross-patient medical record viewing strictly blocked (403 Forbidden)');
    } else {
      fail('Cross-patient medical record access', `Expected 403, got ${crossRes.status}`);
    }
  } catch (err) {
    fail('Cross-patient medical record access', err);
  }

  // ---------------------------------------------------------------------------
  // 4. Doctor Record Retrieval and Update
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Doctor Record Retrieval & Update ---');
  try {
    const docListRes = await fetch(`${API_BASE}/doctor/patients/${patient1Id}/medical-records`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const docListData = await docListRes.json();
    if (docListRes.status === 200 && docListData.records?.length > 0) {
      pass('Doctor queries patient medical history successfully');
    } else {
      fail('Doctor queries patient medical history', docListData.message);
    }
  } catch (err) {
    fail('Doctor queries patient medical history', err);
  }

  try {
    const updateRes = await fetch(`${API_BASE}/doctor/medical-records/${createdRecordId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        notes: 'Patient reported marked improvement on day 3. Fever resolved.',
      }),
    });
    const updateData = await updateRes.json();
    if (updateRes.status === 200 && updateData.success) {
      pass('Doctor updates consultation clinical progress notes');
    } else {
      fail('Doctor updates clinical notes', updateData.message);
    }
  } catch (err) {
    fail('Doctor updates clinical notes', err);
  }

  // ---------------------------------------------------------------------------
  // 5. Nurse Role Permissions & Nursing Observations
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Nurse Role Permissions & Observations ---');
  try {
    const nurseListRes = await fetch(`${API_BASE}/nurse/patients/${patient1Id}/medical-records`, {
      headers: { Authorization: `Bearer ${nurseToken}` },
    });
    const nurseListData = await nurseListRes.json();
    if (nurseListRes.status === 200 && Array.isArray(nurseListData.records)) {
      pass('Nurse views relevant patient clinical records');
    } else {
      fail('Nurse views patient records', nurseListData.message);
    }
  } catch (err) {
    fail('Nurse views patient records', err);
  }

  try {
    // Nurse attempting to prescribe medications should be forbidden
    const nurseBadRes = await fetch(`${API_BASE}/nurse/observations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurseToken}`,
      },
      body: JSON.stringify({
        patientId: patient1Id,
        title: 'Nurse Prescribing Antibiotics',
        diagnosis: 'Bacterial Infection',
        prescriptions: [
          {
            medicationName: 'Ciprofloxacin',
            dosage: '500mg',
            frequency: 'BD',
            duration: '5 days',
          },
        ],
      }),
    });
    const nurseBadData = await nurseBadRes.json();
    if (nurseBadRes.status === 403) {
      pass('Nurse is strictly blocked from creating prescriptions or diagnoses (403 Forbidden)');
    } else {
      fail('Nurse prescription attempt', `Expected 403, got ${nurseBadRes.status}`);
    }
  } catch (err) {
    fail('Nurse prescription attempt', err);
  }

  try {
    // Nurse logging authorized vital signs observation
    const obsRes = await fetch(`${API_BASE}/nurse/observations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurseToken}`,
      },
      body: JSON.stringify({
        patientId: patient1Id,
        title: 'Morning Routine Vitals Check',
        notes: 'Patient resting comfortably. Normal hydration and pulse.',
        vitals: {
          bloodPressure: '120/80 mmHg',
          heartRate: '72 bpm',
          temperature: '98.6 °F',
          oxygenSaturation: '99%',
          respiratoryRate: '16/min',
        },
      }),
    });
    const obsData = await obsRes.json();
    if (obsRes.status === 201 && obsData.record?.recordType === 'nursing_observation') {
      pass('Nurse logs vital signs observation record successfully (201 Created)');
    } else {
      fail('Nurse logs vital signs observation', obsData.message);
    }
  } catch (err) {
    fail('Nurse logs vital signs observation', err);
  }

  // ---------------------------------------------------------------------------
  // 6. Admin Oversight & Non-Destructive Archival
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Admin Oversight & Record Archival ---');
  try {
    const adminListRes = await fetch(`${API_BASE}/admin/medical-records?patientId=${patient1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListData = await adminListRes.json();
    if (adminListRes.status === 200 && adminListData.records?.length >= 2) {
      pass('Admin retrieves hospital-wide medical records filtered by patient');
    } else {
      fail('Admin retrieves medical records', adminListData.message);
    }
  } catch (err) {
    fail('Admin retrieves medical records', err);
  }

  try {
    // Non-destructive archive instead of silent delete
    const archiveRes = await fetch(`${API_BASE}/admin/medical-records/${createdRecordId}/archive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: 'Duplicate test record archived during audit' }),
    });
    const archiveData = await archiveRes.json();
    if (archiveRes.status === 200 && archiveData.record?.isArchived === true) {
      pass('Admin archives medical record non-destructively for audit preservation');
    } else {
      fail('Admin archives medical record', archiveData.message);
    }
  } catch (err) {
    fail('Admin archives medical record', err);
  }

  try {
    // Verify archived record is excluded from patient active list
    const patListAfterRes = await fetch(`${API_BASE}/patient/medical-records`, {
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    const patListAfterData = await patListAfterRes.json();
    const stillPresent = patListAfterData.records?.some((r) => r._id === createdRecordId);
    if (!stillPresent) {
      pass('Archived record is cleanly excluded from patient active medical history');
    } else {
      fail('Archived record filtering', 'Archived record still present in active patient query');
    }
  } catch (err) {
    fail('Archived record filtering', err);
  }

  // Summary
  console.log('\n=============================================================');
  console.log(`📊 Task 11 Suite Results: ${results.passed} Passed, ${results.failed} Failed`);
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

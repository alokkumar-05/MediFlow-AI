import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import DoctorProfile from '../src/models/DoctorProfile.js';
import Department from '../src/models/Department.js';
import Admission from '../src/models/Admission.js';

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
  console.log('🧪 MediFlow-AI Inpatient Admission & Discharge Suite');
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
  let doctorProfileId = '';
  let departmentId = '';
  let createdAdmissionId = '';

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
    const nurseEmail = `nurse.adm.${timestamp}@mediflow.com`;
    await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Nurse Clara ${timestamp}`,
        email: nurseEmail,
        password: 'NursePass@123',
        role: 'nurse',
      }),
    });

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
    fail('Nurse authentication', err);
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
    const email = `patient2_adm_${timestamp}@mediflow.test`;
    const pat2Res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Second Inpatient Test',
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

  // Retrieve Doctor Profile and Department
  try {
    const docProfile = await DoctorProfile.findOne().populate('department');
    if (docProfile) {
      doctorProfileId = docProfile._id.toString();
      departmentId = docProfile.department?._id?.toString() || docProfile.department?.toString();
      pass('Resolved active DoctorProfile and Department');
    } else {
      fail('Resolve DoctorProfile', 'No DoctorProfile in DB');
    }
  } catch (err) {
    fail('Resolve DoctorProfile', err);
  }

  // ---------------------------------------------------------------------------
  // 2. Admission Creation & Single-Active-Admission Rule
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Admission Creation & Conflict Prevention ---');
  try {
    // Missing required bedNumber
    const badBedRes = await fetch(`${API_BASE}/admin/admissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        patientId: patient1Id,
        doctorId: doctorProfileId,
        departmentId,
        admissionReason: 'Severe acute appendicitis requiring observation',
        // bedNumber omitted!
      }),
    });
    const badBedData = await badBedRes.json();
    if (badBedRes.status === 400) {
      pass('Rejects admission missing bed or room identifier (400 Bad Request)');
    } else {
      fail('Rejection of missing bed', badBedData.message);
    }
  } catch (err) {
    fail('Rejection of missing bed', err);
  }

  try {
    // Successful admission creation
    const createRes = await fetch(`${API_BASE}/admin/admissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        patientId: patient1Id,
        doctorId: doctorProfileId,
        departmentId,
        admissionReason: 'Post-operative inpatient monitoring',
        bedNumber: 'Ward-3B-Bed14',
        notes: 'Continuous cardiac telemetry and vitals Q4H',
      }),
    });
    const createData = await createRes.json();
    if (createRes.status === 201 && createData.success && createData.admission?.status === 'admitted') {
      createdAdmissionId = createData.admission._id;
      pass('Admin creates hospital inpatient admission (201 Created, status: admitted)');
    } else {
      fail('Admin creates admission', createData.message);
    }
  } catch (err) {
    fail('Admin creates admission', err);
  }

  try {
    // Single Active Admission Rule: Patient 1 is already admitted
    const doubleAdmRes = await fetch(`${API_BASE}/admin/admissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        patientId: patient1Id,
        doctorId: doctorProfileId,
        departmentId,
        admissionReason: 'Attempted duplicate admission',
        bedNumber: 'ICU-02',
      }),
    });
    const doubleAdmData = await doubleAdmRes.json();
    if (doubleAdmRes.status === 409) {
      pass('Multiple active admissions for same patient strictly rejected (409 Conflict)');
    } else {
      fail('Multiple active admissions rejection', `Expected 409, got ${doubleAdmRes.status}`);
    }
  } catch (err) {
    fail('Multiple active admissions rejection', err);
  }

  // ---------------------------------------------------------------------------
  // 3. Role-Based Visibility & Patient Isolation
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Role-Based Visibility & Patient Isolation ---');
  try {
    const adminListRes = await fetch(`${API_BASE}/admin/admissions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListData = await adminListRes.json();
    if (adminListRes.status === 200 && adminListData.admissions?.length > 0) {
      pass('Admin retrieves master hospital admissions directory');
    } else {
      fail('Admin retrieves admissions', adminListData.message);
    }
  } catch (err) {
    fail('Admin retrieves admissions', err);
  }

  try {
    const docListRes = await fetch(`${API_BASE}/doctor/admissions`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const docListData = await docListRes.json();
    if (docListRes.status === 200 && Array.isArray(docListData.admissions)) {
      pass('Attending Doctor retrieves assigned inpatient roster');
    } else {
      fail('Doctor retrieves assigned admissions', docListData.message);
    }
  } catch (err) {
    fail('Doctor retrieves assigned admissions', err);
  }

  try {
    const nurseListRes = await fetch(`${API_BASE}/nurse/admissions`, {
      headers: { Authorization: `Bearer ${nurseToken}` },
    });
    const nurseListData = await nurseListRes.json();
    if (nurseListRes.status === 200 && nurseListData.admissions?.length > 0) {
      pass('Nurse retrieves active ward admissions queue');
    } else {
      fail('Nurse retrieves active admissions', nurseListData.message);
    }
  } catch (err) {
    fail('Nurse retrieves active admissions', err);
  }

  try {
    const patListRes = await fetch(`${API_BASE}/patient/admissions`, {
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    const patListData = await patListRes.json();
    const found = patListData.admissions?.some((a) => a._id === createdAdmissionId);
    if (patListRes.status === 200 && found) {
      pass('Patient 1 views own admission record');
    } else {
      fail('Patient 1 views own admission', 'Admission not in patient list');
    }
  } catch (err) {
    fail('Patient 1 views own admission', err);
  }

  try {
    // Cross-patient viewing test: Patient 2 tries to access Patient 1's admission
    const crossRes = await fetch(`${API_BASE}/patient/admissions/${createdAdmissionId}`, {
      headers: { Authorization: `Bearer ${patient2Token}` },
    });
    const crossData = await crossRes.json();
    if (crossRes.status === 403) {
      pass('Cross-patient admission record viewing strictly blocked (403 Forbidden)');
    } else {
      fail('Cross-patient admission access', `Expected 403, got ${crossRes.status}`);
    }
  } catch (err) {
    fail('Cross-patient admission access', err);
  }

  // ---------------------------------------------------------------------------
  // 4. Inpatient Bedside Updates
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Inpatient Updates & Nursing Care ---');
  try {
    const nurseCareRes = await fetch(`${API_BASE}/nurse/admissions/${createdAdmissionId}/care`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurseToken}`,
      },
      body: JSON.stringify({
        notes: 'Patient resting comfortably. Vitals stable. Surgical wound clean.',
      }),
    });
    const nurseCareData = await nurseCareRes.json();
    if (nurseCareRes.status === 200 && nurseCareData.success) {
      pass('Nurse updates bedside inpatient care observations');
    } else {
      fail('Nurse updates bedside care', nurseCareData.message);
    }
  } catch (err) {
    fail('Nurse updates bedside care', err);
  }

  // ---------------------------------------------------------------------------
  // 5. Patient Discharge Workflow & Status Transitions
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Discharge Process & Validation ---');
  try {
    // Rejects discharge with empty discharge summary
    const badDischargeRes = await fetch(`${API_BASE}/admissions/${createdAdmissionId}/discharge`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        dischargeSummary: '', // Empty summary!
      }),
    });
    const badDischargeData = await badDischargeRes.json();
    if (badDischargeRes.status === 400) {
      pass('Rejects discharge with empty clinical discharge summary (400 Bad Request)');
    } else {
      fail('Rejection of empty discharge summary', badDischargeData.message);
    }
  } catch (err) {
    fail('Rejection of empty discharge summary', err);
  }

  try {
    // Successful discharge
    const dischargeRes = await fetch(`${API_BASE}/admissions/${createdAdmissionId}/discharge`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        dischargeSummary: 'Patient has successfully recovered with no post-operative complications. Vital signs baseline.',
        treatmentSummary: 'Appendectomy recovery course completed. Oral antibiotics discontinued.',
      }),
    });
    const dischargeData = await dischargeRes.json();
    if (dischargeRes.status === 200 && dischargeData.admission?.status === 'discharged') {
      pass('Doctor executes patient discharge with clinical summary (status: discharged)');
    } else {
      fail('Doctor executes discharge', dischargeData.message);
    }
  } catch (err) {
    fail('Doctor executes discharge', err);
  }

  try {
    // Prevent duplicate discharge or invalid transition
    const reDischargeRes = await fetch(`${API_BASE}/admissions/${createdAdmissionId}/discharge`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        dischargeSummary: 'Attempted duplicate discharge',
      }),
    });
    const reDischargeData = await reDischargeRes.json();
    if (reDischargeRes.status === 400) {
      pass('Rejects invalid status transition on already discharged admission (400 Bad Request)');
    } else {
      fail('Rejection of duplicate discharge', reDischargeData.message);
    }
  } catch (err) {
    fail('Rejection of duplicate discharge', err);
  }

  // ---------------------------------------------------------------------------
  // 6. Hospital Dashboard Metrics API
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Dashboard Metrics API ---');
  try {
    const metricsRes = await fetch(`${API_BASE}/admissions/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const metricsData = await metricsRes.json();
    if (metricsRes.status === 200 && metricsData.metrics?.dischargedCount >= 1) {
      pass('Hospital metrics API returns live counts of active and discharged admissions');
    } else {
      fail('Hospital metrics API', metricsData.message);
    }
  } catch (err) {
    fail('Hospital metrics API', err);
  }

  // Summary
  console.log('\n=============================================================');
  console.log(`📊 Admission Suite Results: ${results.passed} Passed, ${results.failed} Failed`);
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

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runExtendedRBACSuite() {
  console.log('\n=============================================================');
  console.log('🧪 MediFlow-AI Role-Based Access Control & Security Test Suite');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  await connectDB();

  const timestamp = Date.now();
  const testPatientEmail = `ext_patient_${timestamp}@mediflow.test`;
  const testPatientPass = 'ExtPatient@123';
  let patientToken = '';
  let patientCookie = '';

  let adminToken = '';
  let adminCookie = '';
  let adminUserId = '';

  let doctorToken = '';
  let doctorCookie = '';

  let nurseToken = '';
  let nurseCookie = '';

  try {
    // -------------------------------------------------------------------------
    // GROUP A: INPUT VALIDATION & REGISTRATION SECURITY
    // -------------------------------------------------------------------------
    console.log('\n--- GROUP A: Input Validation & Registration Security ---');

    // A1: Missing name rejected
    const regNoName = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `valid_${timestamp}@mediflow.test`, password: 'ValidPass@123' }),
    });
    assert(regNoName.status === 400, 'A1: Registration without name rejected (400)');

    // A2: Missing email rejected
    const regNoEmail = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name', password: 'ValidPass@123' }),
    });
    assert(regNoEmail.status === 400, 'A2: Registration without email rejected (400)');

    // A3: Password shorter than 6 characters rejected
    const regShortPass = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name', email: `valid2_${timestamp}@mediflow.test`, password: '123' }),
    });
    assert(regShortPass.status === 400, 'A3: Registration with password < 6 chars rejected (400)');

    // A4: Successful Patient Registration
    const regSuccess = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Patient',
        email: testPatientEmail,
        password: testPatientPass,
      }),
    });
    const regSuccessData = await regSuccess.json();
    patientToken = regSuccessData.token;
    const cookieHeader = regSuccess.headers.get('set-cookie') || '';
    patientCookie = cookieHeader.split(';')[0];

    assert(
      regSuccess.status === 201 && regSuccessData.user.role === 'patient',
      'A4: Successful patient registration creates role=patient'
    );

    // A5: Privilege escalation on registration: role=doctor / role=nurse safely forced to patient
    const regDoctorAttempt = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Escalation Attempt',
        email: `escalate_${timestamp}@mediflow.test`,
        password: 'ValidPass@123',
        role: 'doctor',
      }),
    });
    const regDoctorData = await regDoctorAttempt.json();
    assert(
      regDoctorAttempt.status === 201 && regDoctorData.user.role === 'patient',
      'A5: Public registration parameter role=doctor forced to patient'
    );

    // -------------------------------------------------------------------------
    // GROUP B: AUTHENTICATION & SESSION HANDLING
    // -------------------------------------------------------------------------
    console.log('\n--- GROUP B: Authentication & Session Handling ---');

    // B1: Login missing password rejected
    const loginNoPass = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testPatientEmail }),
    });
    assert(loginNoPass.status === 400, 'B1: Login without password rejected (400)');

    // B2: Login non-existent email rejected with generic 401
    const loginNonExistent = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `nonexistent_${timestamp}@mediflow.test`, password: 'SomePassword@123' }),
    });
    assert(loginNonExistent.status === 401, 'B2: Non-existent email rejected with generic 401');

    // B3: Login with Admin account
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@mediflow.com',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123456',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.token;
    adminUserId = adminLoginData.user?.id || adminLoginData.user?._id;
    const adminCookieHeader = adminLoginRes.headers.get('set-cookie') || '';
    adminCookie = adminCookieHeader.split(';')[0];

    assert(
      adminLoginRes.status === 200 && adminLoginData.user.role === 'admin',
      'B3: Admin login succeeds and returns role=admin'
    );

    // B4: Login with Doctor demo account
    const docLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'doctor@mediflow.com',
        password: 'Doctor@123456',
      }),
    });
    const docLoginData = await docLoginRes.json();
    doctorToken = docLoginData.token;
    const docCookieHeader = docLoginRes.headers.get('set-cookie') || '';
    doctorCookie = docCookieHeader.split(';')[0];

    assert(
      docLoginRes.status === 200 && docLoginData.user.role === 'doctor',
      'B4: Doctor login succeeds and returns role=doctor'
    );

    // B5: Login with Nurse demo account
    const nurseLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nurse@mediflow.com',
        password: 'Nurse@123456',
      }),
    });
    const nurseLoginData = await nurseLoginRes.json();
    nurseToken = nurseLoginData.token;
    const nurseCookieHeader = nurseLoginRes.headers.get('set-cookie') || '';
    nurseCookie = nurseCookieHeader.split(';')[0];

    assert(
      nurseLoginRes.status === 200 && nurseLoginData.user.role === 'nurse',
      'B5: Nurse login succeeds and returns role=nurse'
    );

    // B6: Session restoration via HTTP-only Cookie without Authorization header
    const cookieAuthRes = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        Cookie: patientCookie,
      },
    });
    const cookieAuthData = await cookieAuthRes.json();
    assert(
      cookieAuthRes.status === 200 && cookieAuthData.user.email === testPatientEmail,
      'B6: Session restoration works via HTTP-only Cookie without Bearer header'
    );

    // B7: GET /api/auth/test-role confirms each user role accurately
    const testRolePatient = await fetch(`${API_BASE}/auth/test-role`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    const testRoleDoc = await fetch(`${API_BASE}/auth/test-role`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const testRoleNurse = await fetch(`${API_BASE}/auth/test-role`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${nurseToken}` },
    });
    const testRoleAdmin = await fetch(`${API_BASE}/auth/test-role`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const dPat = await testRolePatient.json();
    const dDoc = await testRoleDoc.json();
    const dNur = await testRoleNurse.json();
    const dAdm = await testRoleAdmin.json();

    assert(
      dPat.user.role === 'patient' &&
      dDoc.user.role === 'doctor' &&
      dNur.user.role === 'nurse' &&
      dAdm.user.role === 'admin',
      'B7: /api/auth/test-role verifies all 4 distinct roles (patient, doctor, nurse, admin)'
    );

    // -------------------------------------------------------------------------
    // GROUP C: BACKEND RBAC AUTHORIZATION ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n--- GROUP C: Backend RBAC Authorization Enforcement ---');

    // C1: Patient blocked from GET /api/admin/users (403 Forbidden)
    const patientUsersAttempt = await fetch(`${API_BASE}/admin/users`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert(patientUsersAttempt.status === 403, 'C1: Patient blocked from GET /api/admin/users (403)');

    // C2: Doctor blocked from GET /api/admin/users (403 Forbidden)
    const docUsersAttempt = await fetch(`${API_BASE}/admin/users`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert(docUsersAttempt.status === 403, 'C2: Doctor blocked from GET /api/admin/users (403)');

    // C3: Nurse blocked from GET /api/admin/users (403 Forbidden)
    const nurseUsersAttempt = await fetch(`${API_BASE}/admin/users`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${nurseToken}` },
    });
    assert(nurseUsersAttempt.status === 403, 'C3: Nurse blocked from GET /api/admin/users (403)');

    // C4: Nurse blocked from POST /api/admin/staff (403 Forbidden)
    const nurseStaffAttempt = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurseToken}`,
      },
      body: JSON.stringify({
        name: 'Nurse Provision Attempt',
        email: `nurse_staff_${timestamp}@mediflow.test`,
        password: 'Password@123',
        role: 'doctor',
      }),
    });
    assert(nurseStaffAttempt.status === 403, 'C4: Nurse blocked from POST /api/admin/staff (403)');

    // C5: Admin can access GET /api/admin/users (200 OK)
    const adminUsersRes = await fetch(`${API_BASE}/admin/users`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminUsersData = await adminUsersRes.json();
    assert(
      adminUsersRes.status === 200 && Array.isArray(adminUsersData.users),
      'C5: Admin permitted to GET /api/admin/users (200)'
    );

    // C6: Admin can access GET /api/admin/staff (200 OK)
    const adminStaffRes = await fetch(`${API_BASE}/admin/staff`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminStaffData = await adminStaffRes.json();
    assert(
      adminStaffRes.status === 200 && Array.isArray(adminStaffData.staff),
      'C6: Admin permitted to GET /api/admin/staff (200)'
    );

    // C7: Admin staff creation rejects invalid role 'patient' (400 Bad Request)
    const adminCreatePatientAttempt = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Staff Endpoint Patient',
        email: `staff_pat_${timestamp}@mediflow.test`,
        password: 'Password@123',
        role: 'patient', // Not allowed in staff creation
      }),
    });
    assert(
      adminCreatePatientAttempt.status === 400,
      'C7: Admin staff creation rejects invalid role "patient" (400 Bad Request)'
    );

    // C8: Admin provisions new Nurse staff account
    const nurseCreateRes = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Nurse Clara Barton',
        email: `nurse_clara_${timestamp}@mediflow.test`,
        password: 'ClaraPass@123',
        role: 'nurse',
      }),
    });
    const nurseCreateData = await nurseCreateRes.json();
    const createdNurseId = nurseCreateData.user?.id || nurseCreateData.user?._id;
    assert(
      nurseCreateRes.status === 201 && nurseCreateData.user.role === 'nurse',
      'C8: Admin successfully provisions Nurse staff account'
    );

    // C9: Admin self-deactivation protection (Cannot lockout the system)
    const selfDeactivateRes = await fetch(`${API_BASE}/admin/users/${adminUserId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      selfDeactivateRes.status === 400,
      'C9: Admin prevented from deactivating own active account (Self-lockout guard)'
    );

    // C10: Non-admin (Patient) blocked from toggling user status (403 Forbidden)
    const patientToggleAttempt = await fetch(`${API_BASE}/admin/users/${createdNurseId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert(
      patientToggleAttempt.status === 403,
      'C10: Non-admin blocked from toggling user status (403 Forbidden)'
    );

    // C11: Admin can deactivate and reactivate another user
    const deactivateRes = await fetch(`${API_BASE}/admin/users/${createdNurseId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deactivateData = await deactivateRes.json();
    assert(
      deactivateRes.status === 200 && deactivateData.user.isActive === false,
      'C11a: Admin deactivates staff account (isActive: false)'
    );

    // Deactivated user cannot log in
    const deactLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `nurse_clara_${timestamp}@mediflow.test`,
        password: 'ClaraPass@123',
      }),
    });
    assert(
      deactLoginRes.status === 403,
      'C11b: Newly deactivated user immediately rejected on login (403 Forbidden)'
    );

    // Reactivate user
    const reactivateRes = await fetch(`${API_BASE}/admin/users/${createdNurseId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const reactivateData = await reactivateRes.json();
    assert(
      reactivateRes.status === 200 && reactivateData.user.isActive === true,
      'C11c: Admin reactivates staff account (isActive: true)'
    );

    // -------------------------------------------------------------------------
    // GROUP D: CLEANUP TEST DATA
    // -------------------------------------------------------------------------
    await User.deleteMany({
      email: {
        $in: [
          testPatientEmail,
          `escalate_${timestamp}@mediflow.test`,
          `nurse_clara_${timestamp}@mediflow.test`,
        ],
      },
    });

  } catch (err) {
    console.error('Extended test suite execution error:', err);
    failed++;
  } finally {
    await disconnectDB();

    console.log('\n=============================================================');
    console.log(`📊 Extended RBAC Results: ${passed} PASSED | ${failed} FAILED`);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runExtendedRBACSuite();

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runTestSuite() {
  console.log('\n=============================================================');
  console.log('🧪 MediFlow-AI Authentication & RBAC Test Suite');
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

  // Connect to DB directly for state inspections (e.g. hash verification, inactive toggle)
  await connectDB();

  const timestamp = Date.now();
  const testPatientEmail = `patient_${timestamp}@mediflow.test`;
  const testPatientPassword = 'PatientPass@123';
  let patientToken = '';
  let patientCookie = '';
  let adminToken = '';
  let doctorToken = '';

  try {
    // -------------------------------------------------------------
    // Test 1: Successful patient registration
    // -------------------------------------------------------------
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: testPatientEmail,
        password: testPatientPassword,
      }),
    });
    const regData = await regRes.json();
    patientToken = regData.token;
    const cookieHeader = regRes.headers.get('set-cookie') || '';
    patientCookie = cookieHeader.split(';')[0];

    assert(
      regRes.status === 201 && regData.success && regData.user.role === 'patient' && regData.token,
      'Test 1: Successful patient registration',
      `Status: ${regRes.status}`
    );

    // -------------------------------------------------------------
    // Test 2: Password stored as a hash (DB level inspection)
    // -------------------------------------------------------------
    const dbUser = await User.findOne({ email: testPatientEmail }).select('+password');
    const isHashed = dbUser && dbUser.password.startsWith('$2') && dbUser.password !== testPatientPassword;
    assert(
      isHashed,
      'Test 2: Password stored as a strong bcrypt hash in MongoDB',
      `Hash: ${dbUser?.password?.substring(0, 10)}...`
    );

    // -------------------------------------------------------------
    // Test 3: Duplicate email registration rejected
    // -------------------------------------------------------------
    const dupRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Clone',
        email: testPatientEmail,
        password: 'AnotherPassword@123',
      }),
    });
    assert(
      dupRes.status === 409,
      'Test 3: Duplicate email registration rejected with HTTP 409',
      `Status: ${dupRes.status}`
    );

    // -------------------------------------------------------------
    // Test 4: Public attempt to register as admin rejected or safely ignored (role remains patient)
    // -------------------------------------------------------------
    const exploitEmail = `exploit_${timestamp}@mediflow.test`;
    const exploitRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Attempt',
        email: exploitEmail,
        password: 'AttackerPassword@123',
        role: 'admin', // Malicious attempt to escalate role
      }),
    });
    const exploitData = await exploitRes.json();
    const dbExploitUser = await User.findOne({ email: exploitEmail });
    assert(
      exploitRes.status === 201 && exploitData.user.role === 'patient' && dbExploitUser.role === 'patient',
      'Test 4: Public attempt to supply role=admin safely forced to patient role',
      `Assigned Role: ${exploitData.user?.role}`
    );

    // -------------------------------------------------------------
    // Test 5: Successful login
    // -------------------------------------------------------------
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testPatientEmail,
        password: testPatientPassword,
      }),
    });
    const loginData = await loginRes.json();
    assert(
      loginRes.status === 200 && loginData.success && loginData.token && loginData.user.email === testPatientEmail,
      'Test 5: Successful login with token & safe user profile returned',
      `Status: ${loginRes.status}`
    );

    // -------------------------------------------------------------
    // Test 6: Incorrect login rejected
    // -------------------------------------------------------------
    const badLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testPatientEmail,
        password: 'WrongPassword@999',
      }),
    });
    const badLoginData = await badLoginRes.json();
    assert(
      badLoginRes.status === 401 && !badLoginData.success,
      'Test 6: Incorrect password rejected with generic 401 message',
      `Status: ${badLoginRes.status}`
    );

    // -------------------------------------------------------------
    // Test 7: GET /api/auth/me works for an authenticated user
    // -------------------------------------------------------------
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${patientToken}`,
      },
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 && meData.success && meData.user.email === testPatientEmail,
      'Test 7: GET /api/auth/me returns current user profile',
      `Status: ${meRes.status}`
    );

    // -------------------------------------------------------------
    // Test 8: Protected endpoints reject unauthenticated requests
    // -------------------------------------------------------------
    const unauthRes = await fetch(`${API_BASE}/auth/me`, { method: 'GET' });
    assert(
      unauthRes.status === 401,
      'Test 8: Protected endpoints reject unauthenticated requests with 401',
      `Status: ${unauthRes.status}`
    );

    // -------------------------------------------------------------
    // Test 9: Invalid and expired tokens are rejected
    // -------------------------------------------------------------
    const fakeTokenRes = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer fake.invalid.jwt.token' },
    });
    assert(
      fakeTokenRes.status === 401,
      'Test 9: Invalid / forged JWT tokens are rejected with 401',
      `Status: ${fakeTokenRes.status}`
    );

    // -------------------------------------------------------------
    // Test 10: Inactive users are rejected
    // -------------------------------------------------------------
    const inactiveEmail = `inactive_${timestamp}@mediflow.test`;
    const inactiveUser = await User.create({
      name: 'Deactivated User',
      email: inactiveEmail,
      password: 'SamplePassword@123',
      role: 'patient',
      isActive: false, // Inactive
    });
    const inactiveLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inactiveEmail,
        password: 'SamplePassword@123',
      }),
    });
    assert(
      inactiveLoginRes.status === 403,
      'Test 10: Deactivated account rejected with 403 Forbidden',
      `Status: ${inactiveLoginRes.status}`
    );

    // -------------------------------------------------------------
    // Log in as Admin for staff tests
    // -------------------------------------------------------------
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

    // -------------------------------------------------------------
    // Test 11: Non-admin users cannot create staff accounts
    // -------------------------------------------------------------
    const patientStaffAttempt = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`, // Patient token!
      },
      body: JSON.stringify({
        name: 'Unauthorized Doctor',
        email: `doc_attempt_${timestamp}@mediflow.test`,
        password: 'DoctorPass@123',
        role: 'doctor',
      }),
    });
    assert(
      patientStaffAttempt.status === 403,
      'Test 11: Non-admin (Patient) cannot create staff accounts (403 Forbidden)',
      `Status: ${patientStaffAttempt.status}`
    );

    // -------------------------------------------------------------
    // Admin creates Doctor and Nurse accounts
    // -------------------------------------------------------------
    const docEmail = `doctor_${timestamp}@mediflow.test`;
    const docCreateRes = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Dr. Sarah Connor',
        email: docEmail,
        password: 'DoctorPass@123',
        role: 'doctor',
      }),
    });
    const docCreateData = await docCreateRes.json();
    assert(
      docCreateRes.status === 201 && docCreateData.user.role === 'doctor',
      'Admin successfully provisions Doctor staff account',
      `Status: ${docCreateRes.status}`
    );

    // Doctor logs in
    const docLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: docEmail,
        password: 'DoctorPass@123',
      }),
    });
    const docLoginData = await docLoginRes.json();
    doctorToken = docLoginData.token;

    // -------------------------------------------------------------
    // Test 12: Admin-only operations reject patients, doctors, and nurses
    // -------------------------------------------------------------
    const docAdminAttempt = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doctorToken}`, // Doctor token!
      },
      body: JSON.stringify({
        name: 'Doctor Created Admin',
        email: `doc_hacked_${timestamp}@mediflow.test`,
        password: 'Password@123',
        role: 'admin',
      }),
    });
    assert(
      docAdminAttempt.status === 403,
      'Test 12: Admin-only staff creation rejects Doctors (403 Forbidden)',
      `Status: ${docAdminAttempt.status}`
    );

    // -------------------------------------------------------------
    // Test 13: Logout and session behavior work as documented
    // -------------------------------------------------------------
    const logoutRes = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
    });
    const logoutData = await logoutRes.json();
    const logoutCookie = logoutRes.headers.get('set-cookie') || '';
    assert(
      logoutRes.status === 200 && logoutData.success && logoutCookie.includes('token='),
      'Test 13: Logout clears authentication cookie and returns success response',
      `Status: ${logoutRes.status}`
    );

    // Clean up test users from DB
    await User.deleteMany({
      email: {
        $in: [
          testPatientEmail,
          exploitEmail,
          inactiveEmail,
          docEmail,
        ],
      },
    });

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await disconnectDB();

    console.log('\n=============================================================');
    console.log(`📊 Test Results: ${passed} PASSED | ${failed} FAILED`);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTestSuite();

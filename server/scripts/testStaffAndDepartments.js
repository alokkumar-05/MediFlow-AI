import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Department from '../src/models/Department.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runStaffAndDepartmentsSuite() {
  console.log('\n=============================================================');
  console.log('🧪 MediFlow-AI Staff & Department Management Suite');
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
  let adminToken = '';
  let adminId = '';
  let doctorToken = '';
  let nurseToken = '';
  let patientToken = '';

  let createdDeptId = '';
  let createdDoctorId = '';
  let createdNurseId = '';

  const testDeptName = `Cardiology Unit ${timestamp}`;
  const testDept2Name = `Pediatrics Division ${timestamp}`;

  try {
    // -------------------------------------------------------------------------
    // SETUP: Authenticate All 4 Roles
    // -------------------------------------------------------------------------
    console.log('--- SETUP: Authenticating User Roles ---');

    // Admin login
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
    adminId = adminLoginData.user?.id || adminLoginData.user?._id;
    assert(adminLoginRes.status === 200 && adminToken, 'Setup: Admin authenticated');

    // Doctor login
    const docLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor@mediflow.com', password: 'Doctor@123456' }),
    });
    const docLoginData = await docLoginRes.json();
    doctorToken = docLoginData.token;
    assert(docLoginRes.status === 200 && doctorToken, 'Setup: Doctor authenticated');

    // Nurse login
    const nurseLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nurse@mediflow.com', password: 'Nurse@123456' }),
    });
    const nurseLoginData = await nurseLoginRes.json();
    nurseToken = nurseLoginData.token;
    assert(nurseLoginRes.status === 200 && nurseToken, 'Setup: Nurse authenticated');

    // Patient login
    const patLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@mediflow.com', password: 'Patient@123456' }),
    });
    const patLoginData = await patLoginRes.json();
    patientToken = patLoginData.token;
    assert(patLoginRes.status === 200 && patientToken, 'Setup: Patient authenticated');

    // -------------------------------------------------------------------------
    // SECTION 1: DEPARTMENT MANAGEMENT RBAC & SECURITY
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 1: Department Management RBAC & Security ---');

    // D1: Unauthenticated request rejected
    const unauthDeptRes = await fetch(`${API_BASE}/admin/departments`, { method: 'GET' });
    assert(unauthDeptRes.status === 401, 'D1: Unauthenticated request to /admin/departments rejected with 401');

    // D2: Doctor blocked from creating department (403)
    const docDeptAttempt = await fetch(`${API_BASE}/admin/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({ name: 'Unauthorized Dept' }),
    });
    assert(docDeptAttempt.status === 403, 'D2: Doctor blocked from POST /admin/departments (403 Forbidden)');

    // D3: Nurse blocked from creating department (403)
    const nurseDeptAttempt = await fetch(`${API_BASE}/admin/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nurseToken}`,
      },
      body: JSON.stringify({ name: 'Unauthorized Dept' }),
    });
    assert(nurseDeptAttempt.status === 403, 'D3: Nurse blocked from POST /admin/departments (403 Forbidden)');

    // D4: Patient blocked from creating department (403)
    const patDeptAttempt = await fetch(`${API_BASE}/admin/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({ name: 'Unauthorized Dept' }),
    });
    assert(patDeptAttempt.status === 403, 'D4: Patient blocked from POST /admin/departments (403 Forbidden)');

    // -------------------------------------------------------------------------
    // SECTION 2: DEPARTMENT VALIDATION & CREATION
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 2: Department Input Validation & Creation ---');

    // D5: Missing department name rejected (400)
    const noNameRes = await fetch(`${API_BASE}/admin/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ description: 'No name given' }),
    });
    assert(noNameRes.status === 400, 'D5: Creation without name rejected (400 Bad Request)');

    // D6: Short department name rejected (400)
    const shortNameRes = await fetch(`${API_BASE}/admin/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name: 'X' }),
    });
    assert(shortNameRes.status === 400, 'D6: Creation with name < 2 chars rejected (400 Bad Request)');

    // D7: Successful department creation by Admin (201)
    const createDeptRes = await fetch(`${API_BASE}/admin/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: testDeptName,
        code: 'CARDX',
        description: 'Advanced cardiac care and outpatient catheterization unit.',
        location: 'Wing B, Floor 2',
      }),
    });
    const createDeptData = await createDeptRes.json();
    createdDeptId = createDeptData.department?._id;
    assert(
      createDeptRes.status === 201 &&
      createDeptData.success &&
      createDeptData.department?.name === testDeptName &&
      createDeptData.department?.code === 'CARDX' &&
      createDeptData.department?.isActive === true,
      'D7: Admin successfully creates department with 201 Created'
    );

    // D8: Duplicate department name rejected with 409 Conflict
    const dupDeptRes = await fetch(`${API_BASE}/admin/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: testDeptName, // Exact duplicate
        description: 'Duplicate attempt',
      }),
    });
    assert(dupDeptRes.status === 409, 'D8: Duplicate department name rejected with 409 Conflict');

    // D9: Duplicate department name case-insensitive rejected with 409
    const dupCaseRes = await fetch(`${API_BASE}/admin/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: testDeptName.toLowerCase(), // lower case duplicate
      }),
    });
    assert(dupCaseRes.status === 409, 'D9: Case-insensitive duplicate department name rejected (409 Conflict)');

    // D10: Second department created with auto-generated code
    const createDept2Res = await fetch(`${API_BASE}/admin/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: testDept2Name,
        description: 'Child health care unit',
      }),
    });
    const createDept2Data = await createDept2Res.json();
    const createdDept2Id = createDept2Data.department?._id;
    assert(
      createDept2Res.status === 201 && createDept2Data.department?.code === 'PEDI',
      'D10: Auto-generated department code generated when code omitted'
    );

    // -------------------------------------------------------------------------
    // SECTION 3: DEPARTMENT RETRIEVAL, UPDATE & SOFT DELETION
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 3: Department Retrieval, Update & Soft Deletion ---');

    // D11: Admin lists all departments
    const listDeptRes = await fetch(`${API_BASE}/admin/departments`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listDeptData = await listDeptRes.json();
    assert(
      listDeptRes.status === 200 && Array.isArray(listDeptData.departments) && listDeptData.departments.length >= 2,
      'D11: Admin lists all departments (200 OK)'
    );

    // D12: Admin fetches department by ID
    const getDeptRes = await fetch(`${API_BASE}/admin/departments/${createdDeptId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getDeptData = await getDeptRes.json();
    assert(
      getDeptRes.status === 200 && getDeptData.department?.name === testDeptName,
      'D12: Admin retrieves single department by ID (200 OK)'
    );

    // D13: Admin updates department details
    const updatedLoc = 'Tower 3, Level 4, Specialty Suite';
    const updateDeptRes = await fetch(`${API_BASE}/admin/departments/${createdDeptId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        location: updatedLoc,
        description: 'Updated clinical description',
      }),
    });
    const updateDeptData = await updateDeptRes.json();
    assert(
      updateDeptRes.status === 200 && updateDeptData.department?.location === updatedLoc,
      'D13: Admin updates department fields successfully (200 OK)'
    );

    // D14: Updating department name to another existing department's name rejected with 409
    const dupUpdateRes = await fetch(`${API_BASE}/admin/departments/${createdDeptId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: testDept2Name, // Already taken by department 2
      }),
    });
    assert(dupUpdateRes.status === 409, 'D14: Renaming department to an existing name rejected with 409 Conflict');

    // D15: Admin deactivates department via status toggle (soft deactivation)
    const toggleDeptRes = await fetch(`${API_BASE}/admin/departments/${createdDeptId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const toggleDeptData = await toggleDeptRes.json();
    assert(
      toggleDeptRes.status === 200 && toggleDeptData.department?.isActive === false,
      'D15: Admin deactivates department (isActive: false)'
    );

    // D16: Verify department record is preserved in MongoDB (never permanently deleted)
    const dbDept = await Department.findById(createdDeptId);
    assert(
      dbDept !== null && dbDept.isActive === false,
      'D16: Deactivated department record strictly preserved in MongoDB (Historical preservation)'
    );

    // D17: Admin soft-deactivates department 2 via DELETE endpoint
    const deleteDeptRes = await fetch(`${API_BASE}/admin/departments/${createdDept2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dbDept2 = await Department.findById(createdDept2Id);
    assert(
      deleteDeptRes.status === 200 && dbDept2 !== null && dbDept2.isActive === false,
      'D17: DELETE /admin/departments/:id performs safe soft-deactivation without data loss'
    );

    // D18: Read-only active departments endpoint returns only active departments
    const publicDeptsRes = await fetch(`${API_BASE}/departments`, { method: 'GET' });
    const publicDeptsData = await publicDeptsRes.json();
    const hasDeactivated = publicDeptsData.departments?.some((d) => d._id === createdDeptId);
    assert(
      publicDeptsRes.status === 200 && !hasDeactivated,
      'D18: GET /api/departments strictly excludes deactivated departments'
    );

    // -------------------------------------------------------------------------
    // SECTION 4: STAFF MANAGEMENT ENHANCEMENTS & USER DETAILS
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 4: Staff Management Enhancements & User Details ---');

    // S1: Admin provisions Doctor
    const docEmail = `doctor_${timestamp}@mediflow.test`;
    const createDocRes = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Dr. Gregory House',
        email: docEmail,
        password: 'DoctorPass@123',
        role: 'doctor',
      }),
    });
    const createDocData = await createDocRes.json();
    createdDoctorId = createDocData.user?.id || createDocData.user?._id;
    assert(
      createDocRes.status === 201 && createDocData.user?.role === 'doctor',
      'S1: Admin provisions new Doctor staff account (201 Created)'
    );

    // S2: Admin provisions Nurse
    const nurseEmail = `nurse_${timestamp}@mediflow.test`;
    const createNurseRes = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Nurse Jackie Peyton',
        email: nurseEmail,
        password: 'NursePass@123',
        role: 'nurse',
      }),
    });
    const createNurseData = await createNurseRes.json();
    createdNurseId = createNurseData.user?.id || createNurseData.user?._id;
    assert(
      createNurseRes.status === 201 && createNurseData.user?.role === 'nurse',
      'S2: Admin provisions new Nurse staff account (201 Created)'
    );

    // S3: Staff creation rejects role 'patient' (400)
    const patientStaffAttempt = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Patient via Staff Endpoint',
        email: `pat_staff_${timestamp}@mediflow.test`,
        password: 'Password@123',
        role: 'patient',
      }),
    });
    assert(patientStaffAttempt.status === 400, 'S3: Staff creation rejects invalid role "patient" (400 Bad Request)');

    // S4: Staff creation rejects duplicate email (409)
    const dupStaffRes = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Duplicate Doctor',
        email: docEmail,
        password: 'AnotherPassword@123',
        role: 'doctor',
      }),
    });
    assert(dupStaffRes.status === 409, 'S4: Staff creation rejects duplicate email (409 Conflict)');

    // S5: Staff creation rejects password < 6 chars (400)
    const shortPassStaff = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Short Pass Staff',
        email: `short_staff_${timestamp}@mediflow.test`,
        password: '123',
        role: 'nurse',
      }),
    });
    assert(shortPassStaff.status === 400, 'S5: Staff creation rejects password < 6 chars (400 Bad Request)');

    // S6: Admin fetches user details by ID
    const userDetailsRes = await fetch(`${API_BASE}/admin/users/${createdDoctorId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const userDetailsData = await userDetailsRes.json();
    assert(
      userDetailsRes.status === 200 &&
      userDetailsData.user?.name === 'Dr. Gregory House' &&
      userDetailsData.user?.password === undefined,
      'S6: Admin fetches user details by ID (password hash strictly omitted)'
    );

    // S7: Non-admin blocked from fetching user details by ID (403)
    const patUserDetailsAttempt = await fetch(`${API_BASE}/admin/users/${createdDoctorId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert(patUserDetailsAttempt.status === 403, 'S7: Non-admin (Patient) blocked from /admin/users/:id (403 Forbidden)');

    // S8: Admin searches users via server-side search query
    const searchRes = await fetch(`${API_BASE}/admin/users?search=House`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchData = await searchRes.json();
    const foundDoc = searchData.users?.some((u) => u.name.includes('House'));
    assert(searchRes.status === 200 && foundDoc, 'S8: Server-side search filter returns matching user records');

    // S9: Admin self-deactivation guard
    const selfDeactRes = await fetch(`${API_BASE}/admin/users/${adminId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(selfDeactRes.status === 400, 'S9: Admin self-deactivation guard enforced (400 Bad Request)');

    // S10: Non-admin blocked from toggling user status (403)
    const patToggleAttempt = await fetch(`${API_BASE}/admin/users/${createdDoctorId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert(patToggleAttempt.status === 403, 'S10: Non-admin blocked from toggling user status (403 Forbidden)');

    // Clean up test records
    await Department.deleteMany({
      _id: { $in: [createdDeptId, createdDept2Id] },
    });
    await User.deleteMany({
      _id: { $in: [createdDoctorId, createdNurseId] },
    });

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await disconnectDB();

    console.log('\n=============================================================');
    console.log(`📊 Staff & Department Suite Results: ${passed} PASSED | ${failed} FAILED`);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runStaffAndDepartmentsSuite();

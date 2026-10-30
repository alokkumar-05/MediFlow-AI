import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Department from '../src/models/Department.js';
import DoctorProfile, { validateSchedule } from '../src/models/DoctorProfile.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runDoctorProfilesSuite() {
  console.log('\n=============================================================');
  console.log('🧪 MediFlow-AI Doctor Profiles & Availability Suite');
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
  let doctorToken = '';
  let patientToken = '';
  let nurseToken = '';

  let doctorUserId = '';
  let dummyDoctorUserId = '';
  let testDepartmentId = '';
  let inactiveDeptId = '';
  let nonDoctorUserId = '';
  let createdDoctorProfileId = '';

  try {
    // -------------------------------------------------------------------------
    // 1. UNIT VALIDATION TESTS: Availability Schedule Validator
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Availability Schedule Logic & Validation ---');

    // Valid schedule
    const validSchedule = [
      { day: 'monday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
      { day: 'tuesday', startTime: '10:00', endTime: '18:00', breakStart: '', breakEnd: '', isActive: true },
    ];
    const validRes = validateSchedule(validSchedule);
    assert(validRes.valid === true, 'validateSchedule accepts valid 24h intervals with optional break');

    // Invalid day
    const badDay = [{ day: 'funday', startTime: '09:00', endTime: '17:00' }];
    const badDayRes = validateSchedule(badDay);
    assert(badDayRes.valid === false && badDayRes.message.includes('Invalid day'), 'validateSchedule rejects non-existent day of week');

    // Duplicate day
    const dupDay = [
      { day: 'monday', startTime: '09:00', endTime: '13:00' },
      { day: 'monday', startTime: '14:00', endTime: '18:00' },
    ];
    const dupRes = validateSchedule(dupDay);
    assert(dupRes.valid === false && dupRes.message.includes('Duplicate day'), 'validateSchedule rejects duplicate day entries');

    // End time before start time
    const invertedTime = [{ day: 'wednesday', startTime: '17:00', endTime: '09:00' }];
    const invertedRes = validateSchedule(invertedTime);
    assert(invertedRes.valid === false && invertedRes.message.includes('after start time'), 'validateSchedule rejects endTime <= startTime');

    // Break outside shift
    const badBreak = [{ day: 'thursday', startTime: '09:00', endTime: '17:00', breakStart: '08:00', breakEnd: '10:00' }];
    const badBreakRes = validateSchedule(badBreak);
    assert(badBreakRes.valid === false && badBreakRes.message.includes('within working hours'), 'validateSchedule rejects break outside shift hours');

    // -------------------------------------------------------------------------
    // 2. SETUP & AUTHENTICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Setup & Authentication Across Roles ---');

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
    assert(adminLoginRes.status === 200 && adminLoginData.token, 'Admin logs in and receives JWT token');
    adminToken = adminLoginData.token;

    // Doctor login
    const doctorLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'doctor@mediflow.com',
        password: 'Doctor@123456',
      }),
    });
    const doctorLoginData = await doctorLoginRes.json();
    assert(doctorLoginRes.status === 200 && doctorLoginData.token, 'Demo Doctor logs in and receives JWT token');
    doctorToken = doctorLoginData.token;
    doctorUserId = doctorLoginData.user?.id || doctorLoginData.user?._id;

    // Patient login
    const patientLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'patient@mediflow.com',
        password: 'Patient@123456',
      }),
    });
    const patientLoginData = await patientLoginRes.json();
    assert(patientLoginRes.status === 200 && patientLoginData.token, 'Patient logs in and receives JWT token');
    patientToken = patientLoginData.token;

    // Nurse login
    const nurseLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nurse@mediflow.com',
        password: 'Nurse@123456',
      }),
    });
    const nurseLoginData = await nurseLoginRes.json();
    assert(nurseLoginRes.status === 200 && nurseLoginData.token, 'Nurse logs in and receives JWT token');
    nurseToken = nurseLoginData.token;
    nonDoctorUserId = nurseLoginData.user?.id || nurseLoginData.user?._id;

    // Provision an active department for testing
    const deptRes = await fetch(`${API_BASE}/admin/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Clinical Neuro ${timestamp}`,
        code: `CN${String(timestamp).slice(-4)}`,
        location: 'Wing D, 3rd Floor',
      }),
    });
    const deptData = await deptRes.json();
    assert(deptRes.status === 201 && deptData.department?._id, 'Admin creates active department for doctor profile testing');
    testDepartmentId = deptData.department?._id;

    // Provision a deactivated department to test restriction
    const inactDeptRes = await fetch(`${API_BASE}/admin/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Discontinued Ward ${timestamp}`,
        code: `DW${String(timestamp).slice(-4)}`,
        location: 'Old Pavilion',
      }),
    });
    const inactDeptData = await inactDeptRes.json();
    inactiveDeptId = inactDeptData.department?._id;
    // Deactivate it via /status endpoint
    await fetch(`${API_BASE}/admin/departments/${inactiveDeptId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Create a new doctor user to test doctor profile creation
    const newDocRes = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Dr. Gregory House ${timestamp}`,
        email: `house.${timestamp}@mediflow.com`,
        password: 'DoctorPass@123',
        role: 'doctor',
      }),
    });
    const newDocData = await newDocRes.json();
    dummyDoctorUserId = newDocData.user?._id || newDocData.user?.id || newDocData.staff?._id;
    assert(newDocRes.status === 201 && dummyDoctorUserId, 'Admin creates a fresh doctor user account');

    // -------------------------------------------------------------------------
    // 3. ADMIN DOCTOR PROFILE MANAGEMENT ENDPOINTS
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Admin Doctor Profile Management & Integrity ---');

    // Admin lists doctors
    const listRes = await fetch(`${API_BASE}/admin/doctors`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200 && Array.isArray(listData.doctors), 'Admin lists doctor profiles successfully');

    // Non-admin (Patient/Nurse) cannot access admin doctor endpoints
    const unauthRes = await fetch(`${API_BASE}/admin/doctors`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert(unauthRes.status === 403, 'Patient is forbidden (403) from accessing GET /api/admin/doctors');

    const nurseUnauthRes = await fetch(`${API_BASE}/admin/doctors`, {
      headers: { Authorization: `Bearer ${nurseToken}` },
    });
    assert(nurseUnauthRes.status === 403, 'Nurse is forbidden (403) from accessing GET /api/admin/doctors');

    // Reject creating profile for non-doctor role (nurse)
    const nonDocProfileRes = await fetch(`${API_BASE}/admin/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        userId: nonDoctorUserId,
        departmentId: testDepartmentId,
        specialization: 'Nursing Lead',
        qualification: 'BSN, RN',
      }),
    });
    assert(nonDocProfileRes.status === 400, 'Rejects DoctorProfile creation for user who does not have role: doctor');

    // Reject creating profile with inactive department
    const inactDeptAssignRes = await fetch(`${API_BASE}/admin/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        userId: dummyDoctorUserId,
        departmentId: inactiveDeptId,
        specialization: 'Diagnostic Medicine',
        qualification: 'MBBS, MD',
      }),
    });
    assert(inactDeptAssignRes.status === 400, 'Rejects DoctorProfile assignment to deactivated department');

    // Allow creating profile with no department (department is optional initially)
    // First create a second doctor user for no-department test
    const unassignedDocRes = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Dr. James Wilson ${timestamp}`,
        email: `wilson.${timestamp}@mediflow.com`,
        password: 'DoctorPass@123',
        role: 'doctor',
      }),
    });
    const unassignedDocData = await unassignedDocRes.json();
    const unassignedDocId = unassignedDocData.user?._id || unassignedDocData.user?.id || unassignedDocData.staff?._id;

    const noDeptProfileRes = await fetch(`${API_BASE}/admin/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        userId: unassignedDocId,
        specialization: 'Oncological Consultations',
        qualification: 'MD Oncology',
        consultationFee: 750,
      }),
    });
    const noDeptData = await noDeptProfileRes.json();
    assert(noDeptProfileRes.status === 201 && (noDeptData.doctor?.department === null || !noDeptData.doctor?.department), 'DoctorProfile initially created without department (null department allowed)');

    // Create valid profile for dummyDoctorUserId with active department
    const createProfileRes = await fetch(`${API_BASE}/admin/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        userId: dummyDoctorUserId,
        departmentId: testDepartmentId,
        specialization: 'Diagnostic Medicine & Infectious Diseases',
        qualification: 'MD, FACP',
        experienceYears: 15,
        consultationFee: 950,
        roomNumber: 'Cabin 301, Wing D',
        bio: 'Chief of Diagnostic Medicine specializing in rare and complex systemic disorders.',
        availability: {
          slotDuration: 45,
          timeZone: 'UTC',
          schedule: [
            { day: 'monday', startTime: '09:00', endTime: '15:00', breakStart: '12:00', breakEnd: '13:00', isActive: true },
            { day: 'wednesday', startTime: '10:00', endTime: '16:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
          ],
        },
      }),
    });
    const createProfileData = await createProfileRes.json();
    assert(createProfileRes.status === 201 && createProfileData.doctor?._id, 'Admin successfully creates full doctor profile with schedule and department', createProfileData.message || JSON.stringify(createProfileData));
    createdDoctorProfileId = createProfileData.doctor?._id;

    // Reject duplicate profile for same user account
    const dupProfileRes = await fetch(`${API_BASE}/admin/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        userId: dummyDoctorUserId,
        departmentId: testDepartmentId,
        specialization: 'Duplicate Test',
        qualification: 'MD',
      }),
    });
    assert(dupProfileRes.status === 409, 'Rejects duplicate DoctorProfile for the same doctor user (409 Conflict)');

    // Admin updates doctor profile
    const updateRes = await fetch(`${API_BASE}/admin/doctors/${createdDoctorProfileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        consultationFee: 1100,
        roomNumber: 'Suite 404, East Tower',
      }),
    });
    const updateData = await updateRes.json();
    assert(
      updateRes.status === 200 && updateData.doctor?.consultationFee === 1100 && updateData.doctor?.roomNumber === 'Suite 404, East Tower',
      'Admin updates doctor fee and room number'
    );

    // Admin updates availability schedule
    const availUpdateRes = await fetch(`${API_BASE}/admin/doctors/${createdDoctorProfileId}/availability`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        slotDuration: 30,
        timeZone: 'Asia/Kolkata',
        isAcceptingAppointments: true,
        schedule: [
          { day: 'tuesday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
          { day: 'friday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
        ],
      }),
    });
    const availUpdateData = await availUpdateRes.json();
    assert(
      availUpdateRes.status === 200 && availUpdateData.doctor?.availability?.slotDuration === 30,
      'Admin updates doctor weekly schedule and slotDuration'
    );

    // Admin toggles doctor active status
    const toggleRes = await fetch(`${API_BASE}/admin/doctors/${createdDoctorProfileId}/toggle-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const toggleData = await toggleRes.json();
    assert(toggleRes.status === 200 && toggleData.doctor?.isAvailable === false, 'Admin toggles doctor status to unavailable');

    // Toggle back to active
    await fetch(`${API_BASE}/admin/doctors/${createdDoctorProfileId}/toggle-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // -------------------------------------------------------------------------
    // 4. DOCTOR SELF-SERVICE PROFILE & AVAILABILITY ENDPOINTS
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Doctor Self-Service Endpoints (Strict req.user._id) ---');

    // Doctor retrieves own profile
    const docProfileRes = await fetch(`${API_BASE}/doctor/profile`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const docProfileData = await docProfileRes.json();
    assert(docProfileRes.status === 200 && docProfileData.profileExists === true, 'Doctor accesses GET /api/doctor/profile without supplying user ID in params');

    // Doctor updates permitted profile fields (specialty, bio, fee, qualifications)
    const docUpdateRes = await fetch(`${API_BASE}/doctor/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        specialization: 'Advanced Interventional Cardiology',
        consultationFee: 850,
        roomNumber: 'Cabin 204A, East Wing',
        bio: 'Updated clinical bio with advanced robotic angioplasty fellowship.',
      }),
    });
    const docUpdateData = await docUpdateRes.json();
    assert(
      docUpdateRes.status === 200 && docUpdateData.doctor?.consultationFee === 850,
      'Doctor updates own profile information successfully'
    );

    // Doctor updates own weekly availability
    const docAvailRes = await fetch(`${API_BASE}/doctor/availability`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        slotDuration: 30,
        timeZone: 'UTC',
        isAcceptingAppointments: true,
        schedule: [
          { day: 'monday', startTime: '08:30', endTime: '16:30', breakStart: '12:30', breakEnd: '13:30', isActive: true },
          { day: 'wednesday', startTime: '08:30', endTime: '16:30', breakStart: '12:30', breakEnd: '13:30', isActive: true },
        ],
      }),
    });
    const docAvailData = await docAvailRes.json();
    assert(
      docAvailRes.status === 200 && docAvailData.availability?.schedule?.length === 2,
      'Doctor updates own availability schedule and slot durations'
    );

    // Doctor toggles own availability status
    const docToggleRes = await fetch(`${API_BASE}/doctor/availability/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const docToggleData = await docToggleRes.json();
    assert(docToggleRes.status === 200 && docToggleData.isAvailable === false, 'Doctor toggles own availability to unavailable');

    // Toggle back so doctor is available
    await fetch(`${API_BASE}/doctor/availability/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });

    // Patient cannot access /doctor/profile or /doctor/availability (Role restriction)
    const patientForbiddenRes = await fetch(`${API_BASE}/doctor/profile`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert(patientForbiddenRes.status === 403, 'Patient forbidden (403) from accessing doctor self-service /doctor/profile');

    // -------------------------------------------------------------------------
    // 5. PUBLIC DOCTOR DIRECTORY ENDPOINTS
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Public Doctor Directory Endpoints & Data Hygiene ---');

    // Public list doctors (No Auth Required)
    const pubListRes = await fetch(`${API_BASE}/doctors`);
    const pubListData = await pubListRes.json();
    assert(pubListRes.status === 200 && Array.isArray(pubListData.doctors), 'Public GET /api/doctors accessible without authentication');

    // Verify public data does NOT expose sensitive fields (password, tokens, role, __v)
    const samplePubDoc = pubListData.doctors[0];
    assert(
      samplePubDoc &&
      samplePubDoc.name &&
      samplePubDoc.specialization &&
      samplePubDoc.consultationFee &&
      samplePubDoc.password === undefined &&
      samplePubDoc.__v === undefined,
      'Public doctor response is sanitized and contains only safe physician information'
    );

    // Public get doctor by ID
    const pubGetRes = await fetch(`${API_BASE}/doctors/${samplePubDoc._id}`);
    const pubGetData = await pubGetRes.json();
    assert(pubGetRes.status === 200 && pubGetData.doctor?.name === samplePubDoc.name, 'Public GET /api/doctors/:id returns public physician details');

    // Public search and department filter
    const pubFilterRes = await fetch(`${API_BASE}/doctors?department=${testDepartmentId}`);
    const pubFilterData = await pubFilterRes.json();
    assert(pubFilterRes.status === 200 && pubFilterData.doctors.length >= 1, 'Public directory filters specialists by department ID');

    // Summary
    console.log('\n=============================================================');
    console.log(`📊 Doctor Profiles Suite Results: ${passed} Passed, ${failed} Failed`);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled error in doctor profiles test suite:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

runDoctorProfilesSuite();

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Department from '../src/models/Department.js';
import DoctorProfile from '../src/models/DoctorProfile.js';
import Appointment, { isValidStatusTransition } from '../src/models/Appointment.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function runAppointmentsSuite() {
  console.log('\n=============================================================');
  console.log('🧪 MediFlow-AI Appointment Booking & Rostering Suite');
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
  let patient1Token = '';
  let patient1Id = '';
  let patient2Token = '';
  let patient2Id = '';

  let seededDoctorProfileId = '';
  let secondaryDoctorProfileId = '';
  let testDepartmentId = '';
  let bookedAppointmentId = '';
  let bookedAppointment2Id = '';

  try {
    // -------------------------------------------------------------------------
    // 1. SETUP & AUTHENTICATION
    // -------------------------------------------------------------------------
    console.log('--- 1. Authenticating Roles ---');

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
    assert(adminLoginRes.status === 200 && adminLoginData.token, 'Admin authenticated');
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
    assert(doctorLoginRes.status === 200 && doctorLoginData.token, 'Doctor authenticated');
    doctorToken = doctorLoginData.token;

    // Patient 1 login
    const pat1LoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'patient@mediflow.com',
        password: 'Patient@123456',
      }),
    });
    const pat1LoginData = await pat1LoginRes.json();
    assert(pat1LoginRes.status === 200 && pat1LoginData.token, 'Patient 1 authenticated');
    patient1Token = pat1LoginData.token;
    patient1Id = pat1LoginData.user?.id || pat1LoginData.user?._id;

    // Register Patient 2 for ownership verification
    const pat2Email = `patient2_${timestamp}@mediflow.test`;
    const pat2RegRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Second Patient',
        email: pat2Email,
        password: 'PatientPass@123',
      }),
    });
    const pat2RegData = await pat2RegRes.json();
    assert(pat2RegRes.status === 201 && pat2RegData.token, 'Patient 2 registered');
    patient2Token = pat2RegData.token;
    patient2Id = pat2RegData.user?.id || pat2RegData.user?._id;

    // Retrieve seeded Doctor profile (Dr. Sarah Connor)
    const docProfile = await DoctorProfile.findOne().populate('user department');
    assert(docProfile && docProfile._id, 'Seeded DoctorProfile located in database');
    seededDoctorProfileId = docProfile._id.toString();
    testDepartmentId = docProfile.department?._id?.toString() || docProfile.department?.toString();

    // Create a secondary Doctor with profile for reassignment tests
    const doc2UserRes = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Dr. Allison Cameron ${timestamp}`,
        email: `cameron.${timestamp}@mediflow.com`,
        password: 'DoctorPass@123',
        role: 'doctor',
      }),
    });
    const doc2UserData = await doc2UserRes.json();
    const doc2UserId = doc2UserData.user?._id || doc2UserData.user?.id;

    const doc2ProfileRes = await fetch(`${API_BASE}/admin/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        userId: doc2UserId,
        departmentId: testDepartmentId,
        specialization: 'Cardiovascular Surgery',
        qualification: 'MS, MCh',
        consultationFee: 900,
        availability: {
          slotDuration: 30,
          schedule: [
            { day: 'monday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
            { day: 'tuesday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
            { day: 'wednesday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
            { day: 'thursday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
            { day: 'friday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
          ],
        },
      }),
    });
    const doc2ProfileData = await doc2ProfileRes.json();
    secondaryDoctorProfileId = doc2ProfileData.doctor?._id;
    assert(doc2ProfileRes.status === 201 && secondaryDoctorProfileId, 'Secondary Doctor created for reassignment testing');

    // -------------------------------------------------------------------------
    // 2. SLOT GENERATION & LOGIC TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Slot Generation & Scheduling Logic ---');

    // Find a future Monday for deterministic schedule lookup
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + ((1 + 7 - futureDate.getDay()) % 7 || 7)); // Next Monday
    const targetMondayStr = futureDate.toISOString().slice(0, 10);

    const slotQueryRes = await fetch(`${API_BASE}/appointments/available-slots?doctorId=${seededDoctorProfileId}&date=${targetMondayStr}`);
    const slotQueryData = await slotQueryRes.json();
    assert(slotQueryRes.status === 200 && Array.isArray(slotQueryData.slots), 'GET /available-slots returns array of slots for doctor');
    assert(slotQueryData.slots.length > 0, 'Available slots generated according to doctor schedule duration');

    // Verify break exclusion: Ensure no slots overlap with doctor's configured break
    const targetDaySchedule = (docProfile.availability?.schedule || []).find((s) => s.day === 'monday') || {};
    const breakStart = targetDaySchedule.breakStart || '12:30';
    const breakEnd = targetDaySchedule.breakEnd || '13:30';
    const breakOverlap = slotQueryData.slots.some((s) => s.startTime < breakEnd && s.endTime > breakStart);
    assert(breakOverlap === false, `Slot generator strictly excludes configured break interval (${breakStart} - ${breakEnd})`);

    // Missing query parameters validation
    const missingDoctorRes = await fetch(`${API_BASE}/appointments/available-slots?date=${targetMondayStr}`);
    assert(missingDoctorRes.status === 400, 'Rejects available-slots query without doctorId (400 Bad Request)');

    const badDateRes = await fetch(`${API_BASE}/appointments/available-slots?doctorId=${seededDoctorProfileId}&date=invalid-date`);
    assert(badDateRes.status === 400, 'Rejects available-slots query with malformed date format (400 Bad Request)');

    // -------------------------------------------------------------------------
    // 3. PATIENT APPOINTMENT BOOKING & DOUBLE-BOOKING PREVENTION
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Patient Booking & Double-Booking Prevention ---');

    // Rejection of past date booking
    const pastBookRes = await fetch(`${API_BASE}/patient/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`,
      },
      body: JSON.stringify({
        doctorId: seededDoctorProfileId,
        appointmentDate: '2020-01-01',
        startTime: '10:00',
        reason: 'Past date attempt',
      }),
    });
    assert(pastBookRes.status === 400, 'Rejects appointment booking for past date (400 Bad Request)');

    // Successful booking by Patient 1 at 10:00 - 10:30
    const bookRes = await fetch(`${API_BASE}/patient/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`,
      },
      body: JSON.stringify({
        doctorId: seededDoctorProfileId,
        departmentId: testDepartmentId,
        appointmentDate: targetMondayStr,
        startTime: '10:00',
        endTime: '10:30',
        reason: 'Persistent chest tightness and palpitations',
        notes: 'Hypertension history in family',
      }),
    });
    const bookData = await bookRes.json();
    assert(bookRes.status === 201 && bookData.appointment?._id, 'Patient successfully books appointment (201 Created)');
    assert(bookData.appointment?.status === 'pending', 'Newly booked appointment initializes in pending status');
    bookedAppointmentId = bookData.appointment?._id;

    // Double-Booking Prevention: Patient 2 attempts booking exact same slot with same doctor
    const conflictRes = await fetch(`${API_BASE}/patient/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient2Token}`,
      },
      body: JSON.stringify({
        doctorId: seededDoctorProfileId,
        departmentId: testDepartmentId,
        appointmentDate: targetMondayStr,
        startTime: '10:00',
        endTime: '10:30',
        reason: 'Routine checkup',
      }),
    });
    assert(conflictRes.status === 409, 'Double-booking exact slot rejected with 409 Conflict');

    // Partial overlap collision: 10:15 - 10:45 collides with 10:00 - 10:30
    const partialOverlapRes = await fetch(`${API_BASE}/patient/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient2Token}`,
      },
      body: JSON.stringify({
        doctorId: seededDoctorProfileId,
        departmentId: testDepartmentId,
        appointmentDate: targetMondayStr,
        startTime: '10:15',
        endTime: '10:45',
        reason: 'Partial overlap test',
      }),
    });
    assert(partialOverlapRes.status === 409, 'Interval overlap collision strictly rejected with 409 Conflict');

    // Slot exclusion in query: 10:00 - 10:30 should no longer appear in available slots
    const updatedSlotsRes = await fetch(`${API_BASE}/appointments/available-slots?doctorId=${seededDoctorProfileId}&date=${targetMondayStr}`);
    const updatedSlotsData = await updatedSlotsRes.json();
    const hasBookedSlot = updatedSlotsData.slots.some((s) => s.startTime === '10:00');
    assert(hasBookedSlot === false, 'Booked slot is immediately removed from available slots query');

    // Patient 2 books a different non-overlapping slot (11:00 - 11:30)
    const book2Res = await fetch(`${API_BASE}/patient/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient2Token}`,
      },
      body: JSON.stringify({
        doctorId: seededDoctorProfileId,
        departmentId: testDepartmentId,
        appointmentDate: targetMondayStr,
        startTime: '11:00',
        endTime: '11:30',
        reason: 'Cardio fitness assessment',
      }),
    });
    const book2Data = await book2Res.json();
    assert(book2Res.status === 201 && book2Data.appointment?._id, 'Patient 2 successfully books available slot at 11:00');
    bookedAppointment2Id = book2Data.appointment?._id;

    // -------------------------------------------------------------------------
    // 4. PATIENT OWNERSHIP & APPOINTMENT PRIVACY
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Patient Appointment Ownership & Privacy ---');

    // Patient 1 lists own appointments
    const p1ListRes = await fetch(`${API_BASE}/patient/appointments`, {
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    const p1ListData = await p1ListRes.json();
    assert(p1ListRes.status === 200 && Array.isArray(p1ListData.appointments), 'Patient 1 retrieves list of own appointments');
    const p1OwnsAll = p1ListData.appointments.every((a) => a.patient?._id === patient1Id || a.patient === patient1Id);
    assert(p1OwnsAll, 'Patient 1 list strictly contains only appointments owned by Patient 1');

    // Patient 1 views appointment 1 details
    const p1GetRes = await fetch(`${API_BASE}/patient/appointments/${bookedAppointmentId}`, {
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    assert(p1GetRes.status === 200, 'Patient 1 views own appointment details (200 OK)');

    // Patient 2 is blocked from viewing Patient 1's appointment (403 Forbidden)
    const crossPatientRes = await fetch(`${API_BASE}/patient/appointments/${bookedAppointmentId}`, {
      headers: { Authorization: `Bearer ${patient2Token}` },
    });
    assert(crossPatientRes.status === 403, 'Cross-patient appointment viewing blocked (403 Forbidden)');

    // Patient 2 is blocked from cancelling Patient 1's appointment
    const crossCancelRes = await fetch(`${API_BASE}/patient/appointments/${bookedAppointmentId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient2Token}`,
      },
      body: JSON.stringify({ cancellationReason: 'Malicious attempt' }),
    });
    assert(crossCancelRes.status === 403, 'Cross-patient appointment cancellation blocked (403 Forbidden)');

    // -------------------------------------------------------------------------
    // 5. PATIENT RESCHEDULING & CANCELLATION WORKFLOW
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Patient Rescheduling & Cancellation ---');

    // Patient 1 reschedules appointment 1 to 14:00 - 14:30
    const rescheduleRes = await fetch(`${API_BASE}/patient/appointments/${bookedAppointmentId}/reschedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`,
      },
      body: JSON.stringify({
        newDate: targetMondayStr,
        newStartTime: '14:00',
        reason: 'Shifted schedule to afternoon',
      }),
    });
    const rescheduleData = await rescheduleRes.json();
    assert(rescheduleRes.status === 201 && rescheduleData.appointment?.startTime === '14:00', 'Patient reschedules appointment to new slot');
    assert(rescheduleData.appointment?.rescheduledFrom === bookedAppointmentId, 'New appointment references original appointment in rescheduledFrom');

    // Verify original appointment was marked cancelled with reason
    const oldAppt = await Appointment.findById(bookedAppointmentId);
    assert(oldAppt.status === 'cancelled' && oldAppt.cancellationReason.includes('Rescheduled'), 'Previous appointment auto-cancelled upon rescheduling');

    // The rescheduled appointment is now our primary active appointment for Patient 1
    const activeApptId = rescheduleData.appointment._id;

    // Patient 2 cancels appointment 2
    const cancelP2Res = await fetch(`${API_BASE}/patient/appointments/${bookedAppointment2Id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient2Token}`,
      },
      body: JSON.stringify({ cancellationReason: 'Work conflict on Monday' }),
    });
    const cancelP2Data = await cancelP2Res.json();
    assert(cancelP2Res.status === 200 && cancelP2Data.appointment?.status === 'cancelled', 'Patient cancels appointment successfully');

    // Cannot cancel already cancelled appointment
    const dupCancelRes = await fetch(`${API_BASE}/patient/appointments/${bookedAppointment2Id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient2Token}`,
      },
      body: JSON.stringify({ cancellationReason: 'Double cancel' }),
    });
    assert(dupCancelRes.status === 400, 'Rejects cancellation of already cancelled appointment (400 Bad Request)');

    // -------------------------------------------------------------------------
    // 6. DOCTOR APPOINTMENT MANAGEMENT & STATUS TRANSITIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Doctor Appointment Management & Status Transitions ---');

    // Doctor lists assigned appointments
    const docApptsRes = await fetch(`${API_BASE}/doctor/appointments?date=${targetMondayStr}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const docApptsData = await docApptsRes.json();
    assert(docApptsRes.status === 200 && Array.isArray(docApptsData.appointments), 'Doctor retrieves assigned appointments');

    // Doctor confirms pending appointment
    const confirmRes = await fetch(`${API_BASE}/doctor/appointments/${activeApptId}/confirm`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const confirmData = await confirmRes.json();
    assert(confirmRes.status === 200 && confirmData.appointment?.status === 'confirmed', 'Doctor confirms pending appointment (status: confirmed)');

    // Doctor completes confirmed appointment
    const completeRes = await fetch(`${API_BASE}/doctor/appointments/${activeApptId}/complete`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({ notes: 'Patient consulted, prescribed ECG and beta blockers' }),
    });
    const completeData = await completeRes.json();
    assert(completeRes.status === 200 && completeData.appointment?.status === 'completed', 'Doctor completes confirmed appointment (status: completed)');

    // Terminal state protection: Cannot transition completed appointment back to pending or cancelled
    const invalidTransRes = await fetch(`${API_BASE}/doctor/appointments/${activeApptId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({ status: 'pending' }),
    });
    assert(invalidTransRes.status === 400, 'Terminal state protection: Rejects transition from completed to pending');

    // Create another appointment to test doctor marking no-show
    const noShowAppt = await Appointment.create({
      patient: patient1Id,
      doctor: seededDoctorProfileId,
      department: testDepartmentId,
      appointmentDate: targetMondayStr,
      startTime: '15:00',
      endTime: '15:30',
      reason: 'Followup consultation',
      status: 'confirmed',
    });

    const noShowRes = await fetch(`${API_BASE}/doctor/appointments/${noShowAppt._id}/no-show`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const noShowData = await noShowRes.json();
    assert(noShowRes.status === 200 && noShowData.appointment?.status === 'no_show', 'Doctor marks confirmed appointment as no-show');

    // -------------------------------------------------------------------------
    // 7. ADMIN APPOINTMENT OVERSIGHT & DOCTOR REASSIGNMENT
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Admin Appointment Oversight & Reassignment ---');

    // Admin lists all appointments across hospital
    const adminListRes = await fetch(`${API_BASE}/admin/appointments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListData = await adminListRes.json();
    assert(adminListRes.status === 200 && adminListData.appointments.length >= 3, 'Admin retrieves global appointment directory');

    // Admin filters by status
    const filterCompletedRes = await fetch(`${API_BASE}/admin/appointments?status=completed`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const filterCompletedData = await filterCompletedRes.json();
    assert(
      filterCompletedRes.status === 200 && filterCompletedData.appointments.every((a) => a.status === 'completed'),
      'Admin filters appointments by status=completed'
    );

    // Create an appointment to test admin reassignment
    const reassignAppt = await Appointment.create({
      patient: patient1Id,
      doctor: seededDoctorProfileId,
      department: testDepartmentId,
      appointmentDate: targetMondayStr,
      startTime: '16:00',
      endTime: '16:30',
      reason: 'Urgent consult needing doctor swap',
      status: 'pending',
    });

    // Admin reassigns doctor
    const reassignRes = await fetch(`${API_BASE}/admin/appointments/${reassignAppt._id}/assign-doctor`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ newDoctorId: secondaryDoctorProfileId }),
    });
    const reassignData = await reassignRes.json();
    assert(
      reassignRes.status === 200 && reassignData.appointment?.doctor?._id === secondaryDoctorProfileId,
      'Admin reassigns appointment to secondary doctor'
    );

    // Admin updates appointment status to confirmed
    const adminStatusRes = await fetch(`${API_BASE}/admin/appointments/${reassignAppt._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'confirmed' }),
    });
    const adminStatusData = await adminStatusRes.json();
    assert(adminStatusRes.status === 200 && adminStatusData.appointment?.status === 'confirmed', 'Admin updates appointment status to confirmed');

    // Summary
    console.log('\n=============================================================');
    console.log(`📊 Appointment Suite Results: ${passed} Passed, ${failed} Failed`);
    console.log('=============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled error in appointment test suite:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

runAppointmentsSuite();

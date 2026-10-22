import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

import DashboardLayout from '../layouts/DashboardLayout.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

// Auth Pages
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import UnauthorizedPage from '../pages/UnauthorizedPage.jsx';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import AdminUsersPage from '../pages/admin/AdminUsersPage.jsx';
import AdminDoctorsPage from '../pages/admin/AdminDoctorsPage.jsx';
import AdminNursesPage from '../pages/admin/AdminNursesPage.jsx';
import AdminDepartmentsPage from '../pages/admin/AdminDepartmentsPage.jsx';
import AdminAppointmentsPage from '../pages/admin/AdminAppointmentsPage.jsx';
import AdminAssignmentsPage from '../pages/admin/AdminAssignmentsPage.jsx';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage.jsx';

// Doctor Pages
import DoctorDashboard from '../pages/doctor/DoctorDashboard.jsx';
import DoctorAppointmentsPage from '../pages/doctor/DoctorAppointmentsPage.jsx';
import DoctorPatientsPage from '../pages/doctor/DoctorPatientsPage.jsx';
import DoctorMedicalRecordsPage from '../pages/doctor/DoctorMedicalRecordsPage.jsx';
import DoctorAiAssistantPage from '../pages/doctor/DoctorAiAssistantPage.jsx';
import DoctorSettingsPage from '../pages/doctor/DoctorSettingsPage.jsx';

// Nurse Pages
import NurseDashboard from '../pages/nurse/NurseDashboard.jsx';
import NurseAssignedPatientsPage from '../pages/nurse/NurseAssignedPatientsPage.jsx';
import NurseAppointmentsPage from '../pages/nurse/NurseAppointmentsPage.jsx';
import NurseCareRecordsPage from '../pages/nurse/NurseCareRecordsPage.jsx';
import NurseSettingsPage from '../pages/nurse/NurseSettingsPage.jsx';

// Patient Pages
import PatientDashboard from '../pages/patient/PatientDashboard.jsx';
import PatientBookAppointmentPage from '../pages/patient/PatientBookAppointmentPage.jsx';
import PatientAppointmentsPage from '../pages/patient/PatientAppointmentsPage.jsx';
import PatientDoctorsPage from '../pages/patient/PatientDoctorsPage.jsx';
import PatientMedicalRecordsPage from '../pages/patient/PatientMedicalRecordsPage.jsx';
import PatientAiAssistantPage from '../pages/patient/PatientAiAssistantPage.jsx';
import PatientProfilePage from '../pages/patient/PatientProfilePage.jsx';
import PatientSettingsPage from '../pages/patient/PatientSettingsPage.jsx';

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-xs text-slate-400">Loading MediFlow-AI...</p>
      </div>
    );
  }

  if (isAuthenticated && user?.role) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <Navigate to="/login" replace />;
}

function NotFoundPage() {
  return (
    <div className="py-24 text-center">
      <h2 className="text-4xl font-black text-slate-800">404</h2>
      <p className="text-sm font-semibold text-slate-700 mt-2">Page Not Found</p>
      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
        The requested URL was not found in the MediFlow-AI navigation tree.
      </p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root Intelligent Redirection */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
          <Route path="/admin/nurses" element={<AdminNursesPage />} />
          <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
          <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
          <Route path="/admin/assignments" element={<AdminAssignmentsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      {/* Doctor Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
          <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
          <Route path="/doctor/medical-records" element={<DoctorMedicalRecordsPage />} />
          <Route path="/doctor/ai-assistant" element={<DoctorAiAssistantPage />} />
          <Route path="/doctor/settings" element={<DoctorSettingsPage />} />
        </Route>
      </Route>

      {/* Nurse Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['nurse']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/nurse/dashboard" element={<NurseDashboard />} />
          <Route path="/nurse/assigned-patients" element={<NurseAssignedPatientsPage />} />
          <Route path="/nurse/appointments" element={<NurseAppointmentsPage />} />
          <Route path="/nurse/care-records" element={<NurseCareRecordsPage />} />
          <Route path="/nurse/settings" element={<NurseSettingsPage />} />
        </Route>
      </Route>

      {/* Patient Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/book-appointment" element={<PatientBookAppointmentPage />} />
          <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
          <Route path="/patient/doctors" element={<PatientDoctorsPage />} />
          <Route path="/patient/medical-records" element={<PatientMedicalRecordsPage />} />
          <Route path="/patient/ai-assistant" element={<PatientAiAssistantPage />} />
          <Route path="/patient/profile" element={<PatientProfilePage />} />
          <Route path="/patient/settings" element={<PatientSettingsPage />} />
        </Route>
      </Route>

      {/* Catch-all 404 Route */}
      <Route element={<DashboardLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

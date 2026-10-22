import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import AppointmentsPage from '../pages/AppointmentsPage.jsx';
import PatientsPage from '../pages/PatientsPage.jsx';
import DoctorsPage from '../pages/DoctorsPage.jsx';
import DepartmentsPage from '../pages/DepartmentsPage.jsx';
import AiAssistantPage from '../pages/AiAssistantPage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';

function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <h2 className="text-3xl font-bold text-slate-900">404</h2>
      <p className="text-sm text-slate-500 mt-2">The page you are looking for does not exist.</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="ai-assistant" element={<AiAssistantPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

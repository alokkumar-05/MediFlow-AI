import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const attemptedPath = location.state?.attemptedPath || 'the requested page';

  const userRoleDashboard = user?.role ? `/${user.role}/dashboard` : '/login';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5 border border-amber-200">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
        <p className="text-sm text-slate-500 mt-2">
          Your current role (<span className="font-semibold text-slate-700 capitalize">{user?.role || 'Guest'}</span>) is not permitted to access <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{attemptedPath}</code>.
        </p>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl text-left border border-slate-100 text-xs text-slate-600 space-y-1">
          <p className="font-medium text-slate-700">Role-Based Security Policy:</p>
          <p>• Admin: Hospital staff administration & configuration</p>
          <p>• Doctor: Clinical queues & patient medical records</p>
          <p>• Nurse: Inpatient care & vitals administration</p>
          <p>• Patient: Personal bookings & self medical charts</p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            size="md"
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Home}
            onClick={() => navigate(userRoleDashboard)}
          >
            My Role Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

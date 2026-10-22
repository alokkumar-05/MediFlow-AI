import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Stethoscope, 
  Building2, 
  Sparkles, 
  Settings, 
  Activity,
  X,
  LogOut,
  UserCheck,
  HeartHandshake,
  Layers,
  FileText,
  CalendarPlus,
  HeartPulse,
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';

const ROLE_NAV_ITEMS = {
  admin: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Staff & Users', path: '/admin/users', icon: Users },
    { name: 'Doctors Directory', path: '/admin/doctors', icon: Stethoscope },
    { name: 'Nurses Directory', path: '/admin/nurses', icon: HeartHandshake },
    { name: 'Departments', path: '/admin/departments', icon: Building2 },
    { name: 'Appointments', path: '/admin/appointments', icon: Calendar },
    { name: 'Assignments', path: '/admin/assignments', icon: Layers },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ],
  doctor: [
    { name: 'Clinical Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
    { name: 'My Appointments', path: '/doctor/appointments', icon: Calendar },
    { name: 'My Patients', path: '/doctor/patients', icon: Users },
    { name: 'Medical Records', path: '/doctor/medical-records', icon: FileText },
    { name: 'AI Clinical Briefs', path: '/doctor/ai-assistant', icon: Sparkles },
    { name: 'Doctor Settings', path: '/doctor/settings', icon: Settings },
  ],
  nurse: [
    { name: 'Ward Dashboard', path: '/nurse/dashboard', icon: LayoutDashboard },
    { name: 'Assigned Patients', path: '/nurse/assigned-patients', icon: Users },
    { name: 'Shift Appointments', path: '/nurse/appointments', icon: Calendar },
    { name: 'Care & Vitals Logs', path: '/nurse/care-records', icon: HeartPulse },
    { name: 'Nurse Settings', path: '/nurse/settings', icon: Settings },
  ],
  patient: [
    { name: 'Patient Portal', path: '/patient/dashboard', icon: LayoutDashboard },
    { name: 'Book Appointment', path: '/patient/book-appointment', icon: CalendarPlus },
    { name: 'My Appointments', path: '/patient/appointments', icon: Calendar },
    { name: 'Find Doctors', path: '/patient/doctors', icon: Stethoscope },
    { name: 'My Health Records', path: '/patient/medical-records', icon: FileText },
    { name: 'AI Symptom Triage', path: '/patient/ai-assistant', icon: Sparkles },
    { name: 'My Profile', path: '/patient/profile', icon: UserIcon },
    { name: 'Account Settings', path: '/patient/settings', icon: Settings },
  ],
};

const ROLE_BADGES = {
  admin: { label: 'Admin Control', color: 'bg-red-50 text-red-700 border-red-200' },
  doctor: { label: 'Doctor / Physician', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  nurse: { label: 'Nurse Care', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  patient: { label: 'Patient Portal', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userRole = user?.role || 'patient';
  const navItems = ROLE_NAV_ITEMS[userRole] || ROLE_NAV_ITEMS.patient;
  const roleBadge = ROLE_BADGES[userRole] || ROLE_BADGES.patient;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg leading-tight block">MediFlow<span className="text-blue-600">.ai</span></span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Hospital OS</span>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Role Indicator */}
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Role</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleBadge.color}`}>
              {roleBadge.label}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 truncate mt-1">{user?.name || 'User Session'}</p>
        </div>

        {/* Role-Specific Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate">{item.name}</span>
                    {item.name.includes('AI') && (
                      <span className="ml-auto text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                        AI
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Logout Button */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

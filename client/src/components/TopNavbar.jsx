import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Menu, HeartPulse, LogOut, Shield } from 'lucide-react';

export default function TopNavbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'U';

  const roleColors = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    doctor: 'bg-blue-100 text-blue-800 border-blue-200',
    nurse: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    patient: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const userRole = user?.role || 'patient';

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <HeartPulse className="w-3.5 h-3.5 text-blue-600" />
          <span>Hospital Operations Portal</span>
          <span className="text-slate-300">•</span>
          <span className="text-emerald-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            RBAC Enforced
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <span
          className={`capitalize text-xs font-semibold px-2.5 py-1 rounded-full border ${
            roleColors[userRole] || roleColors.patient
          }`}
        >
          {userRole}
        </span>

        {/* User Profile Block */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
            {initials}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{user?.email}</p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

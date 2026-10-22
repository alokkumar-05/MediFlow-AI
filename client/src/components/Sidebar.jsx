import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Stethoscope, 
  Building2, 
  Sparkles, 
  Settings, 
  Activity,
  X
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Appointments', path: '/appointments', icon: Calendar },
  { name: 'Patients', path: '/patients', icon: Users },
  { name: 'Doctors', path: '/doctors', icon: Stethoscope },
  { name: 'Departments', path: '/departments', icon: Building2 },
  { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
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

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
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
                    <span>{item.name}</span>
                    {item.name === 'AI Assistant' && (
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

        {/* Footer info card */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-700">Phase 1 Foundation</span>
            </div>
            <p className="text-[11px] text-slate-500">MERN Architecture Ready</p>
          </div>
        </div>
      </aside>
    </>
  );
}

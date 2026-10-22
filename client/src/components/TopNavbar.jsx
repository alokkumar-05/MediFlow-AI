import React from 'react';
import { Menu, Bell, ShieldCheck, HeartPulse } from 'lucide-react';

export default function TopNavbar({ onMenuToggle }) {
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
            System Online
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-100">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Phase 1 Scaffolding</span>
        </div>

        <button 
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg relative"
          title="Notifications placeholder"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
            MD
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-medium text-slate-800">Admin Staff</p>
            <p className="text-[10px] text-slate-400">Sample Session</p>
          </div>
        </div>
      </div>
    </header>
  );
}

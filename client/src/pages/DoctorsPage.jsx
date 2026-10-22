import React from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { Stethoscope, UserCheck, CalendarDays, Info } from 'lucide-react';

export default function DoctorsPage() {
  return (
    <div>
      <PageHeader
        title="Doctor Profiles & Rostering"
        subtitle="Manage clinician specializations, consultation fees, and weekly availability schedules"
        action={
          <Button icon={UserCheck} disabled>
            Add Doctor (Phase 2)
          </Button>
        }
      />

      <div className="mb-6 p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-blue-900">Upcoming Doctor Management Implementation (Phase 2 & 3)</p>
          <p className="text-blue-700/90 text-xs mt-0.5">
            This module will support recurring weekly availability configuration (days of the week, shift hours, slot intervals), leave management, and direct patient assignment to doctors.
          </p>
        </div>
      </div>

      <Card title="Medical Staff Roster" subtitle="Department clinicians and availability">
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 border border-blue-100">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Doctor Directory Ready for Scaffolding</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Doctor profile cards, consultation fee settings, and availability calendars will be connected to the doctor API in Phase 2.
          </p>
          <div className="mt-6">
            <Button variant="outline" size="sm" icon={CalendarDays} disabled>
              Configure Schedule Rules
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { Calendar, AlertCircle } from 'lucide-react';

export default function AdminAppointmentsPage() {
  return (
    <div>
      <PageHeader
        title="Hospital Master Appointments"
        subtitle="Global outpatient booking schedule, doctor utilization, and emergency slot reassignments"
      />

      <div className="mb-6 p-4 rounded-xl bg-blue-50/70 border border-blue-200/70 flex items-start gap-3 text-xs text-blue-800">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900">Appointment Engine Staged for Phase 3</p>
          <p className="mt-0.5">
            Admin oversight features will include cross-department booking calendars, slot conflict resolution, emergency doctor reassignment, and status audit logs.
          </p>
        </div>
      </div>

      <Card title="Global Schedule" subtitle="Centralized OPD schedule monitor">
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 border border-purple-100">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Centralized Schedule Standby</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Live outpatient booking queues and doctor schedules will be activated in Phase 3.
          </p>
        </div>
      </Card>
    </div>
  );
}

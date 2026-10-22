import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { Calendar, Clock } from 'lucide-react';

export default function NurseAppointmentsPage() {
  return (
    <div>
      <PageHeader
        title="Shift Appointments & Outpatient Assistance"
        subtitle="Daily clinic schedules, walk-in patient triage, and OPD consultation support"
      />

      <Card title="Shift Schedule" subtitle="OPD clinic support duties">
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Clinic Queue Assistance (Phase 3)</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Nurses will be able to check in arriving patients, verify vitals before the doctor consultation, and assist with walk-in bookings.
          </p>
        </div>
      </Card>
    </div>
  );
}

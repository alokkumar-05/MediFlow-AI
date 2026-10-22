import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

export default function DoctorAppointmentsPage() {
  return (
    <div>
      <PageHeader
        title="Physician Appointment Schedule"
        subtitle="Manage daily consultation slots, mark visits as completed, and review patient appointments"
      />

      <Card title="Consultation Schedule" subtitle="Assigned patient bookings">
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Dynamic Schedule Management (Phase 3)</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Doctors will be able to review their patient list for any date, view reported symptoms, transition appointments to 'Completed', and trigger digital prescription creation.
          </p>
        </div>
      </Card>
    </div>
  );
}

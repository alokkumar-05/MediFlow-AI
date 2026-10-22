import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { Settings, Calendar, DollarSign, Clock } from 'lucide-react';

export default function DoctorSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Doctor Profile & Practice Settings"
        subtitle="Configure consultation availability, weekly working hours, and consultation fees"
      />

      <div className="space-y-6">
        <Card title="Availability & Slot Duration" subtitle="Weekly recurring consultation schedule">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <Clock className="w-8 h-8 text-blue-600 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Weekly Shift Schedule (Phase 3)</h4>
              <p className="text-xs text-slate-500 mt-1">
                Configure working days (Monday-Saturday), working hours (e.g., 09:00 - 13:00), 30-minute slot increments, and vacation leave dates.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Consultation Fee & Cabin" subtitle="Practice details">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <DollarSign className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Fee & Room Configuration (Phase 3)</h4>
              <p className="text-xs text-slate-500 mt-1">
                Set consultation fee in INR, cabin/room number, and qualifications displayed to patients booking appointments.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

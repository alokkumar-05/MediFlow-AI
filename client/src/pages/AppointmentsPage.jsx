import React from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { Calendar, Clock, Plus, Filter, Info } from 'lucide-react';

export default function AppointmentsPage() {
  return (
    <div>
      <PageHeader
        title="Appointments Management"
        subtitle="Schedule, confirm, reschedule, and track consultation bookings"
        action={
          <Button icon={Plus} disabled>
            New Booking
          </Button>
        }
      />

      <div className="mb-6 p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-blue-900">Clinical Appointment Scheduling</p>
          <p className="text-blue-700/90 text-xs mt-0.5">
            This module features dynamic 30-minute slot calculation, doctor availability matching, concurrency-safe booking locks, and status transitions (Pending → Confirmed → Completed / Cancelled).
          </p>
        </div>
      </div>

      <Card title="Appointment Queue" subtitle="Current schedule preview">
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 border border-blue-100">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No active appointments loaded</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Appointment booking, status filters, and live doctor calendar integrations are connected to the central appointment service.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button variant="outline" size="sm" icon={Filter} disabled>
              Filter by Department
            </Button>
            <Button variant="secondary" size="sm" icon={Clock} disabled>
              View Today's Slots
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

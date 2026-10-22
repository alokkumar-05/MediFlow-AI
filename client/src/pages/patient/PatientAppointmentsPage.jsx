import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { Calendar, CalendarPlus, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientAppointmentsPage() {
  return (
    <div>
      <PageHeader
        title="My Appointments"
        subtitle="View upcoming consultations, past appointment histories, and cancellation controls"
        action={
          <Link to="/patient/book-appointment">
            <Button icon={CalendarPlus} variant="primary">
              Book New
            </Button>
          </Link>
        }
      />

      <Card title="Appointment History" subtitle="Your consultation records">
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Appointment Management (Phase 3)</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Track upcoming visits, download appointment slips, reschedule consultations, or cancel up to 2 hours before the appointment.
          </p>
        </div>
      </Card>
    </div>
  );
}

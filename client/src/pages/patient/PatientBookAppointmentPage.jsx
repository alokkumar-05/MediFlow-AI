import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { CalendarPlus, Sparkles, Stethoscope, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientBookAppointmentPage() {
  return (
    <div>
      <PageHeader
        title="Book Outpatient Consultation"
        subtitle="Select a medical department, pick your doctor, and reserve a 30-minute time slot"
      />

      <div className="mb-6 p-4 rounded-xl bg-blue-50/70 border border-blue-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-800">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">Not sure which department you need?</p>
            <p className="mt-0.5">Use our Gemini-powered AI symptom triage to get a recommended department.</p>
          </div>
        </div>
        <Link to="/patient/ai-assistant">
          <Button variant="outline" size="sm" icon={Sparkles}>
            Launch AI Triage
          </Button>
        </Link>
      </div>

      <Card title="Appointment Booking Engine" subtitle="30-minute slot reservation system">
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
            <CalendarPlus className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Interactive Slot Engine (Phase 3)</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Department selection, doctor calendar lookup, available 30-minute slot pills, and conflict-free booking confirmation will be activated in Phase 3.
          </p>
        </div>
      </Card>
    </div>
  );
}

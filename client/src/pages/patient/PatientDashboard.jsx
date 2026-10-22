import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Calendar, 
  FileText, 
  Sparkles, 
  Stethoscope, 
  Clock, 
  CheckCircle,
  CalendarPlus,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientDashboard() {
  const { user } = useAuth();

  const patientMetrics = [
    { label: 'Upcoming Consultations', value: '1', note: 'Sample Data', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Prescriptions', value: '2', note: 'Sample Data', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Completed Visits', value: '4', note: 'Sample Data', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Available Departments', value: '9', note: 'Hospital Directory', icon: Stethoscope, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div>
      <PageHeader
        title={`Hello, ${user?.name || 'Patient'}`}
        subtitle="Manage your hospital appointments, medical records, and AI symptom triage"
        action={
          <Link to="/patient/book-appointment">
            <Button icon={CalendarPlus} variant="primary">
              Book Appointment
            </Button>
          </Link>
        }
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {patientMetrics.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  <span className="inline-block mt-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {stat.note}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Next Appointment Card & Quick Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Upcoming Appointment" subtitle="Sample confirmed consultation" className="lg:col-span-2">
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                DR
              </div>
              <div>
                <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Cardiology Department</span>
                <h4 className="text-sm font-bold text-slate-900">Dr. Sarah Connor, MD</h4>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Tomorrow at 10:00 AM • Cabin 204
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Confirmed (Sample)
            </span>
          </div>

          <div className="mt-4 flex items-center justify-end">
            <Link to="/patient/appointments" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All Appointments <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        <Card title="Patient Care Hub" subtitle="Health tools">
          <div className="space-y-2.5">
            <Link to="/patient/ai-assistant" className="p-3 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200/70 transition-all block group">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600">AI Symptom Triage</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Check which department suits your symptoms</p>
            </Link>

            <Link to="/patient/medical-records" className="p-3 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200/70 transition-all block group">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-600">My Health Records</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Review prescriptions and lab test results</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

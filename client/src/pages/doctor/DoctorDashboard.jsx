import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Calendar, 
  Users, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DoctorDashboard() {
  const { user } = useAuth();

  const doctorMetrics = [
    { label: "Today's OPD Queue", value: '12', note: 'Sample Data', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Inpatients', value: '4', note: 'Sample Data', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Lab Reports to Review', value: '3', note: 'Sample Data', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed Consultations', value: '5', note: 'Sample Data', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const sampleQueue = [
    { id: 'APP-101', patient: 'Arthur Dent', time: '09:30 AM', type: 'Follow-up Consultation', status: 'In Waiting' },
    { id: 'APP-102', patient: 'Tricia McMillan', time: '10:00 AM', type: 'Initial Evaluation', status: 'Next' },
    { id: 'APP-103', patient: 'Ford Prefect', time: '10:30 AM', type: 'Lab Review', status: 'Scheduled' },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome, Dr. ${user?.name || 'Physician'}`}
        subtitle="Physician workspace, outpatient consultation queue, and clinical records review"
        action={
          <Link to="/doctor/appointments">
            <Button icon={Calendar} variant="primary">
              View Full Schedule
            </Button>
          </Link>
        }
      />

      {/* Clinician-in-the-loop Notice */}
      <div className="mb-6 p-4 rounded-xl bg-blue-50/70 border border-blue-200/70 flex items-start gap-3">
        <Stethoscope className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-blue-900">Clinical Decision Support Active</p>
          <p className="text-blue-700/90 text-xs mt-0.5">
            AI medical analysis and patient-history briefs are assistive only. You retain sole authority to verify, amend, or reject AI-generated findings prior to committing records.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {doctorMetrics.map((stat, i) => {
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

      {/* Today's Queue & AI Assistant Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Today's Consultation Queue" subtitle="Sample scheduled patient appointments" className="lg:col-span-2">
          <div className="divide-y divide-slate-100">
            {sampleQueue.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-xs">{item.patient}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.id}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.type} • {item.time}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    {item.status}
                  </span>
                  <Link to="/doctor/medical-records" className="text-slate-400 hover:text-blue-600">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="AI Clinical Intelligence" subtitle="Clinician tools preview">
          <div className="space-y-3">
            <Link to="/doctor/ai-assistant" className="p-3 rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 transition-all block group">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600">Patient History Briefs</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">150-word synthesis of prior patient consultations (Phase 5)</p>
            </Link>

            <Link to="/doctor/medical-records" className="p-3 rounded-lg bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 transition-all block group">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-600">Report OCR & Lab Extraction</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Side-by-side biomarker verification screen (Phase 5)</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

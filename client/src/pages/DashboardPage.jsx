import React from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { 
  Users, 
  Calendar, 
  Stethoscope, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const stats = [
    { label: 'Total Registered Patients', value: '1,280', note: 'Sample Data', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: "Today's Appointments", value: '42', note: 'Sample Data', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Available Doctors on Duty', value: '18', note: 'Sample Data', icon: Stethoscope, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Pending Triage & Requests', value: '7', note: 'Sample Data', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div>
      <PageHeader 
        title="Hospital Overview" 
        subtitle="Operational metrics and system status overview"
        action={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Phase 1 Scaffold Active
            </span>
          </div>
        }
      />

      {/* Sample Data Disclaimer Banner */}
      <div className="mb-6 p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-blue-900">Phase 1 Foundation Demonstration</p>
          <p className="text-blue-700/90 text-xs mt-0.5">
            All numerical metrics, charts, and table rows displayed across this dashboard are illustrative sample data for interface verification. Business logic and live database models will be connected in subsequent phases.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="hover:border-slate-300 transition-colors">
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

      {/* Secondary content cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Architecture Checklist */}
        <Card 
          title="Phase 1 Foundation Status" 
          subtitle="Verification of core system prerequisites"
          className="lg:col-span-2"
        >
          <div className="space-y-3">
            {[
              { title: 'Frontend Architecture', desc: 'React 18 + Vite + Tailwind CSS + Lucide React configured with pure JavaScript', done: true },
              { title: 'Client-Side Navigation', desc: 'React Router configured for all 7 primary hospital modules', done: true },
              { title: 'Backend Foundation', desc: 'Express.js server with health check (GET /api/health) and CORS configured', done: true },
              { title: 'Database Decoupling', desc: 'Mongoose connection logic modularized without blocking server bootstrap', done: true },
              { title: 'Phase 2 Readiness', desc: 'Architecture prepared for JWT Authentication & Role-Based Access Control', done: true }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Links Card */}
        <Card 
          title="Module Navigation" 
          subtitle="Direct links to system components"
        >
          <div className="space-y-2">
            {[
              { name: 'Appointments Manager', path: '/appointments', desc: 'Slot scheduling workflow' },
              { name: 'Patient Directory', path: '/patients', desc: 'Profiles & EMR records' },
              { name: 'Doctor Management', path: '/doctors', desc: 'Rostering & availability' },
              { name: 'Departments', path: '/departments', desc: 'Hospital unit directory' },
              { name: 'AI Clinical Assistant', path: '/ai-assistant', desc: 'Clinical triage & extraction' },
            ].map((link, idx) => (
              <Link 
                key={idx} 
                to={link.path}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-blue-50/70 text-slate-700 hover:text-blue-700 transition-colors group border border-transparent hover:border-blue-100"
              >
                <div>
                  <p className="text-xs font-semibold">{link.name}</p>
                  <p className="text-[11px] text-slate-400">{link.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

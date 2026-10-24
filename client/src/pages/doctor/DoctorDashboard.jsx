import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { 
  Calendar, 
  Users, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Stethoscope,
  ChevronRight,
  BedDouble
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    todayCount: 0,
    activeInpatients: 0,
    completedCount: 0,
    totalAppointments: 0,
    loading: true,
  });
  const [todayQueue, setTodayQueue] = useState([]);

  useEffect(() => {
    async function loadDoctorData() {
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const [apptsRes, admRes] = await Promise.allSettled([
          api.get('/doctor/appointments'),
          api.get('/doctor/admissions?status=admitted'),
        ]);

        let todayAppts = [];
        let completed = 0;
        let total = 0;
        let inpatients = 0;

        if (apptsRes.status === 'fulfilled' && apptsRes.value.data?.appointments) {
          const list = apptsRes.value.data.appointments;
          total = list.length;
          todayAppts = list.filter((a) => a.appointmentDate === todayStr);
          completed = list.filter((a) => a.status === 'completed').length;
        }

        if (admRes.status === 'fulfilled' && admRes.value.data?.admissions) {
          inpatients = admRes.value.data.admissions.length;
        }

        setMetrics({
          todayCount: todayAppts.length,
          activeInpatients: inpatients,
          completedCount: completed,
          totalAppointments: total,
          loading: false,
        });
        setTodayQueue(todayAppts.slice(0, 5));
      } catch (err) {
        setMetrics((prev) => ({ ...prev, loading: false }));
      }
    }

    loadDoctorData();
  }, []);

  const doctorMetrics = [
    { 
      label: "Today's OPD Queue", 
      value: metrics.loading ? '...' : metrics.todayCount.toString(), 
      note: 'Scheduled Consultations', 
      icon: Clock, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      link: '/doctor/appointments'
    },
    { 
      label: 'Active Inpatients', 
      value: metrics.loading ? '...' : metrics.activeInpatients.toString(), 
      note: 'Assigned Wards', 
      icon: BedDouble, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50',
      link: '/doctor/patients'
    },
    { 
      label: 'Completed Visits', 
      value: metrics.loading ? '...' : metrics.completedCount.toString(), 
      note: 'Clinical Records Issued', 
      icon: CheckCircle2, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      link: '/doctor/medical-records'
    },
    { 
      label: 'Total Consultations', 
      value: metrics.loading ? '...' : metrics.totalAppointments.toString(), 
      note: 'All-Time Appointments', 
      icon: Calendar, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      link: '/doctor/appointments'
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, Dr. ${user?.name || 'Physician'}`}
        subtitle="Physician workspace, outpatient consultation queue, and inpatient ward caseload"
        action={
          <Link to="/doctor/appointments">
            <Button icon={Calendar} variant="primary">
              View Appointments
            </Button>
          </Link>
        }
      />

      {/* Clinician Notice */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/70 flex items-start gap-3">
        <Stethoscope className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-blue-900">Clinical Responsibility & Care Standards</p>
          <p className="text-blue-700/90 text-xs mt-0.5">
            You hold primary clinical decision authority for all assigned outpatient consultations and inpatient admissions.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {doctorMetrics.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link key={i} to={stat.link} className="block group">
              <Card className="group-hover:border-primary-300 transition-all">
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
            </Link>
          );
        })}
      </div>

      {/* Today's Queue & Fast Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Today's Consultation Schedule" subtitle="Live OPD appointment arrivals" className="lg:col-span-2">
          {todayQueue.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No outpatient appointments scheduled for today. Check your full appointment calendar.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todayQueue.map((item) => (
                <div key={item._id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-xs">{item.patient?.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.startTime} – {item.endTime}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.reason}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                      item.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : item.status === 'completed'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                    <Link to="/doctor/appointments" className="text-slate-400 hover:text-blue-600">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Inpatient & Clinical Directives" subtitle="Caseload shortcuts">
          <div className="space-y-3">
            <Link to="/doctor/patients" className="p-3 rounded-lg bg-slate-50 hover:bg-purple-50/60 border border-slate-200/80 transition-all block group">
              <div className="flex items-center gap-2.5">
                <BedDouble className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-slate-800 group-hover:text-purple-600">Assigned Inpatients ({metrics.activeInpatients})</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Review active hospital ward admissions and discharge orders</p>
            </Link>

            <Link to="/doctor/medical-records" className="p-3 rounded-lg bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 transition-all block group">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-600">EMR & Prescriptions</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Write consultation charts and structured prescriptions</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

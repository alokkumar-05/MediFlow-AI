import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { 
  HeartPulse, 
  Users, 
  Calendar, 
  BedDouble, 
  Clock, 
  CheckCircle,
  Plus,
  ChevronRight,
  Stethoscope
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NurseDashboard() {
  const { user } = useAuth();
  const [inpatients, setInpatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNurseData() {
      try {
        const res = await api.get('/nurse/admissions?status=admitted');
        if (res.data?.success) {
          setInpatients(res.data.admissions || []);
        }
      } catch (err) {
        console.error('Error fetching nurse admissions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadNurseData();
  }, []);

  const nurseMetrics = [
    { 
      label: 'Active Ward Inpatients', 
      value: loading ? '...' : inpatients.length.toString(), 
      note: 'Under Nursing Care', 
      icon: Users, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      link: '/nurse/assigned-patients'
    },
    { 
      label: 'Vitals & Care Station', 
      value: 'Active', 
      note: 'Hourly Observation Rounds', 
      icon: HeartPulse, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      link: '/nurse/care-records'
    },
    { 
      label: 'Ward Beds Occupied', 
      value: loading ? '...' : inpatients.length.toString(), 
      note: 'Allocated Beds', 
      icon: BedDouble, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50',
      link: '/nurse/assigned-patients'
    },
    { 
      label: 'Shift Status', 
      value: 'On Duty', 
      note: 'Triage & Monitoring', 
      icon: Clock, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      link: '/nurse/appointments'
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Nursing Station — ${user?.name || 'Staff'}`}
        subtitle="Inpatient ward monitoring, shift vitals logs, and bedside clinical care"
        action={
          <Link to="/nurse/care-records">
            <Button icon={Plus} variant="primary">
              Log Patient Vitals
            </Button>
          </Link>
        }
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {nurseMetrics.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link key={i} to={item.link} className="block group">
              <Card className="group-hover:border-primary-300 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{item.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{item.value}</p>
                    <span className="inline-block mt-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {item.note}
                    </span>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Live Ward Inpatients Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Ward Inpatients Roster" subtitle="Admitted patients currently under ward care" className="lg:col-span-2">
          {inpatients.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No active inpatients currently assigned to this ward station.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {inpatients.slice(0, 5).map((adm) => (
                <div key={adm._id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-xs">{adm.patient?.name}</span>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Bed: {adm.bedNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Attending: Dr. {adm.attendingDoctor?.user?.name || 'Physician'} • {adm.department?.name || 'General Ward'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link to="/nurse/care-records" className="text-xs font-medium text-primary-600 hover:text-primary-700">
                      Record Vitals →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Shift Actions" subtitle="Nursing workflows">
          <div className="space-y-3">
            <Link to="/nurse/care-records" className="p-3 rounded-lg bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 transition-all block group">
              <div className="flex items-center gap-2.5">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-600">Vitals & Observations</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Record BP, HR, SpO2, and temperature readings</p>
            </Link>

            <Link to="/nurse/assigned-patients" className="p-3 rounded-lg bg-slate-50 hover:bg-purple-50/60 border border-slate-200/80 transition-all block group">
              <div className="flex items-center gap-2.5">
                <BedDouble className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-slate-800 group-hover:text-purple-600">Ward Bed Roster</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Check bed allocation and update bedside care notes</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

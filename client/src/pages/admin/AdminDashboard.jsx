import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import { 
  Users, 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  UserPlus, 
  Layers, 
  Calendar,
  HeartHandshake
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    doctors: 0,
    nurses: 0,
    patients: 0,
    departments: 0,
    loading: true,
  });

  useEffect(() => {
    async function loadMetrics() {
      try {
        const [usersRes, deptsRes, admRes] = await Promise.allSettled([
          api.get('/admin/users'),
          api.get('/admin/departments'),
          api.get('/admin/admissions/metrics'),
        ]);

        let docs = 0;
        let nurses = 0;
        let patients = 0;
        let depts = 0;
        let activeInpatients = 0;

        if (usersRes.status === 'fulfilled' && usersRes.value.data?.users) {
          const uList = usersRes.value.data.users;
          docs = uList.filter((u) => u.role === 'doctor').length;
          nurses = uList.filter((u) => u.role === 'nurse').length;
          patients = uList.filter((u) => u.role === 'patient').length;
        }

        if (deptsRes.status === 'fulfilled' && deptsRes.value.data?.departments) {
          depts = deptsRes.value.data.departments.length;
        }

        if (admRes.status === 'fulfilled' && admRes.value.data?.metrics) {
          activeInpatients = admRes.value.data.metrics.activeCount || 0;
        }

        setMetrics({
          doctors: docs,
          nurses,
          patients,
          departments: depts,
          activeInpatients,
          loading: false,
        });
      } catch (err) {
        setMetrics((prev) => ({ ...prev, loading: false }));
      }
    }

    loadMetrics();
  }, []);


  const adminMetrics = [
    { 
      label: 'Active Doctors', 
      value: metrics.loading ? '...' : metrics.doctors.toString(), 
      icon: Stethoscope, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50', 
      link: '/admin/doctors' 
    },
    { 
      label: 'Active Inpatients', 
      value: metrics.loading ? '...' : (metrics.activeInpatients || 0).toString(), 
      icon: Layers, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50', 
      link: '/admin/assignments' 
    },
    { 
      label: 'Total Patients', 
      value: metrics.loading ? '...' : metrics.patients.toString(), 
      icon: Users, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50', 
      link: '/admin/users' 
    },
    { 
      label: 'Hospital Departments', 
      value: metrics.loading ? '...' : metrics.departments.toString(), 
      icon: Building2, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50', 
      link: '/admin/departments' 
    },
  ];


  return (
    <div>
      <PageHeader
        title="Hospital Administration Console"
        subtitle="Operational metrics, staff provisioning, and hospital resource management"
        action={
          <Link to="/admin/users">
            <Button icon={UserPlus} variant="primary">
              Manage Staff & Users
            </Button>
          </Link>
        }
      />

      {/* Role Banner */}
      <div className="mb-6 p-4 rounded-xl bg-red-50/70 border border-red-200/70 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-red-900">Administrator Clearance Active</p>
          <p className="text-red-700/90 text-xs mt-0.5">
            You have full system control to create doctors, nurses, and administrative users. Public self-registration by visitors is restricted strictly to patient accounts.
          </p>
        </div>
      </div>

      {/* Admin Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {adminMetrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link key={idx} to={item.link} className="block group">
              <Card className="group-hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{item.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{item.value}</p>
                    <span className="inline-block mt-1 text-[11px] font-medium text-blue-600">
                      View Directory →
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

      {/* Admin Module Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Quick Staff Actions" subtitle="Administrative management" className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link to="/admin/users" className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 transition-all block group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">Provision Staff Account</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Create Doctor, Nurse, or Admin</p>
                </div>
              </div>
            </Link>

            <Link to="/admin/departments" className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 transition-all block group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">Manage Departments</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Configure clinical units</p>
                </div>
              </div>
            </Link>

            <Link to="/admin/appointments" className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 transition-all block group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 group-hover:text-purple-700">Hospital Appointments</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Review master schedule</p>
                </div>
              </div>
            </Link>

            <Link to="/admin/assignments" className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 transition-all block group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 group-hover:text-amber-700">Bed & Doctor Assignment</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Inpatient allocation</p>
                </div>
              </div>
            </Link>
          </div>
        </Card>

        <Card title="System Health" subtitle="Live backend status">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-700">MongoDB Atlas</span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-700">RBAC Enforcement</span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                4 Roles Guarded
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-700">Auth Token Transport</span>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                HTTP-Only Cookie
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

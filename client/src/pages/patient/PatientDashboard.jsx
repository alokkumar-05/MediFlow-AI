import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { 
  Calendar, 
  FileText, 
  Sparkles, 
  Stethoscope, 
  Clock, 
  CheckCircle,
  CalendarPlus,
  ArrowRight,
  BedDouble,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [recordsCount, setRecordsCount] = useState(0);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatientData() {
      try {
        const [apptsRes, recordsRes, admRes] = await Promise.allSettled([
          api.get('/patient/appointments'),
          api.get('/patient/medical-records'),
          api.get('/patient/admissions'),
        ]);

        if (apptsRes.status === 'fulfilled' && apptsRes.value.data?.appointments) {
          setAppointments(apptsRes.value.data.appointments);
        }
        if (recordsRes.status === 'fulfilled' && recordsRes.value.data?.records) {
          setRecordsCount(recordsRes.value.data.records.length);
        }
        if (admRes.status === 'fulfilled' && admRes.value.data?.admissions) {
          setAdmissions(admRes.value.data.admissions);
        }
      } catch (err) {
        console.error('Error fetching patient dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPatientData();
  }, []);

  const upcomingAppointments = appointments.filter(
    (a) => ['pending', 'confirmed'].includes(a.status)
  );

  const activeAdmission = admissions.find((a) => a.status === 'admitted');
  const pastDischarge = admissions.find((a) => a.status === 'discharged');

  const patientMetrics = [
    { 
      label: 'Upcoming Consultations', 
      value: loading ? '...' : upcomingAppointments.length.toString(), 
      note: 'Scheduled Visits', 
      icon: Calendar, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      link: '/patient/appointments'
    },
    { 
      label: 'Verified Health Records', 
      value: loading ? '...' : recordsCount.toString(), 
      note: 'Charts & Prescriptions', 
      icon: FileText, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      link: '/patient/medical-records'
    },
    { 
      label: 'Inpatient Status', 
      value: activeAdmission ? 'Admitted' : 'Outpatient', 
      note: activeAdmission ? `Bed ${activeAdmission.bedNumber}` : 'Home Care', 
      icon: BedDouble, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50',
      link: '/patient/appointments'
    },
    { 
      label: 'Hospital Admissions', 
      value: loading ? '...' : admissions.length.toString(), 
      note: 'Admission History', 
      icon: CheckCircle, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      link: '/patient/appointments'
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${user?.name || 'Patient'}`}
        subtitle="Manage your hospital appointments, clinical medical records, and inpatient stay details"
        action={
          <Link to="/patient/book-appointment">
            <Button icon={CalendarPlus} variant="primary">
              Book Appointment
            </Button>
          </Link>
        }
      />

      {/* Active Inpatient Banner if currently admitted */}
      {activeAdmission && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 font-bold">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Active Inpatient Stay — Room/Bed: {activeAdmission.bedNumber}</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-800 text-[11px] font-semibold">
                  ADMITTED
                </span>
              </div>
              <p className="text-xs text-purple-700 mt-0.5">
                Attending: Dr. {activeAdmission.attendingDoctor?.user?.name || 'Assigned Physician'} • Dept: {activeAdmission.department?.name || 'Ward'}
              </p>
              <p className="text-[11px] text-purple-600 mt-0.5">
                Admitted on: {new Date(activeAdmission.admissionDate).toLocaleDateString()} for {activeAdmission.admissionReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {patientMetrics.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link key={i} to={stat.link} className="block group">
              <Card className="group-hover:border-primary-300 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    <span className="inline-block mt-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
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

      {/* Next Appointment Card & Discharge History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Upcoming Consultation" subtitle="Your next scheduled outpatient visit" className="lg:col-span-2">
          {upcomingAppointments.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No upcoming consultations</p>
              <p className="text-xs text-slate-400 mt-1">Book an appointment with any available doctor in our hospital.</p>
              <Link to="/patient/book-appointment" className="mt-3 inline-block">
                <Button size="sm" variant="primary">Book New Slot</Button>
              </Link>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  DR
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                    {upcomingAppointments[0].department?.name || 'Outpatient Clinic'}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    Dr. {upcomingAppointments[0].doctor?.user?.name || 'Physician'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{upcomingAppointments[0].appointmentDate} • {upcomingAppointments[0].startTime} – {upcomingAppointments[0].endTime}</span>
                  </p>
                </div>
              </div>
              <Link to="/patient/appointments">
                <Button variant="outline" size="sm" icon={ArrowRight}>
                  View Schedule
                </Button>
              </Link>
            </div>
          )}
        </Card>

        <Card title="Clinical Summary & History" subtitle="Your hospital care records">
          <div className="space-y-3">
            {pastDischarge && (
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  Recent Discharge Summary
                </div>
                <p className="text-slate-700 mt-1 line-clamp-3">
                  {pastDischarge.dischargeSummary}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Discharged: {new Date(pastDischarge.dischargeDate).toLocaleDateString()}
                </p>
              </div>
            )}

            <Link to="/patient/medical-records" className="p-3 rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 transition-all block group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-600" />
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-primary-600">
                    Medical History & Prescriptions
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>

            <Link to="/patient/doctors" className="p-3 rounded-lg bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 transition-all block group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-600">
                    Find Specialist Doctors
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  HeartPulse, 
  Users, 
  Calendar, 
  BedDouble, 
  Clock, 
  CheckCircle,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NurseDashboard() {
  const { user } = useAuth();

  const nurseMetrics = [
    { label: 'Ward Inpatients Under Care', value: '8', note: 'Sample Data', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Vitals Checks Scheduled', value: '4', note: 'Sample Data', icon: HeartPulse, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Medications Due This Shift', value: '6', note: 'Sample Data', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Available Ward Beds', value: '5', note: 'Sample Data', icon: BedDouble, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const sampleRounds = [
    { bed: 'Bed A-12', patient: 'Robert Vance', vitalsDue: '10:00 AM', status: 'Pending Vitals', bp: '120/80', temp: '98.6°F' },
    { bed: 'Bed A-14', patient: 'Phyllis Lapin', vitalsDue: '10:30 AM', status: 'Vitals Recorded', bp: '130/85', temp: '99.1°F' },
    { bed: 'Bed B-03', patient: 'Stanley Hudson', vitalsDue: '11:00 AM', status: 'Scheduled', bp: '125/82', temp: '98.4°F' },
  ];

  return (
    <div>
      <PageHeader
        title={`Nursing Station — ${user?.name || 'Staff'}`}
        subtitle="Inpatient ward monitoring, shift vitals checks, and medication administration"
        action={
          <Link to="/nurse/care-records">
            <Button icon={Plus} variant="primary">
              Log Vitals (Phase 4)
            </Button>
          </Link>
        }
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {nurseMetrics.map((item, i) => {
          const Icon = item.icon;
          return (
            <Card key={i}>
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
          );
        })}
      </div>

      {/* Ward Patients Vitals Schedule */}
      <Card title="Ward Vitals Schedule" subtitle="Sample inpatient care rounds">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <th className="pb-3 pl-2">Bed & Inpatient</th>
                <th className="pb-3">Round Time</th>
                <th className="pb-3">Latest Vitals (Sample)</th>
                <th className="pb-3 pr-2 text-right">Round Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sampleRounds.map((round, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 pl-2">
                    <span className="font-bold text-slate-900 block">{round.patient}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{round.bed}</span>
                  </td>
                  <td className="py-3 text-slate-600">{round.vitalsDue}</td>
                  <td className="py-3">
                    <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      BP: {round.bp} | Temp: {round.temp}
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      round.status.includes('Recorded')
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {round.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

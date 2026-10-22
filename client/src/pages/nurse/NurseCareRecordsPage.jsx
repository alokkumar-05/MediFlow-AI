import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { HeartPulse, Plus } from 'lucide-react';

export default function NurseCareRecordsPage() {
  return (
    <div>
      <PageHeader
        title="Vitals & Nursing Care Records"
        subtitle="Log patient vital signs (Blood Pressure, Heart Rate, SpO2, Temperature) and medication administrations"
        action={
          <Button icon={Plus} variant="primary" disabled>
            Record Vitals (Phase 4)
          </Button>
        }
      />

      <Card title="Vitals Monitoring System" subtitle="Inpatient clinical tracking">
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Vitals Logging Engine (Phase 4)</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Nurses can log structured vital sign readings (BP, HR, SpO2, Temp) tied to specific admission records with automatic critical value alerts.
          </p>
        </div>
      </Card>
    </div>
  );
}

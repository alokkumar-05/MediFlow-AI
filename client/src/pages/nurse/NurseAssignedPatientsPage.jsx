import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { Users, BedDouble } from 'lucide-react';

export default function NurseAssignedPatientsPage() {
  return (
    <div>
      <PageHeader
        title="Assigned Inpatients"
        subtitle="Current ward admissions, bed allocations, and attending physician directives"
      />

      <Card title="Ward Inpatients" subtitle="Active admission roster">
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
            <BedDouble className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Inpatient Care Directory (Phase 4)</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Nurses can view all admitted patients in their assigned ward, check admitting diagnoses, and view primary doctor treatment plans.
          </p>
        </div>
      </Card>
    </div>
  );
}

import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { Layers, BedDouble, UserCheck } from 'lucide-react';

export default function AdminAssignmentsPage() {
  return (
    <div>
      <PageHeader
        title="Doctor & Ward Assignments"
        subtitle="Manage inpatient bed allocation, attending consultant assignments, and nurse ward assignments"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card title="IPD Ward Allocation" subtitle="Bed inventory preview">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Inpatient Ward Management</h4>
              <p className="text-xs text-slate-500 mt-0.5">Tracks ICU, General, and Private wards (Phase 4)</p>
            </div>
          </div>
        </Card>

        <Card title="Clinical Lead Assignment" subtitle="Primary doctor pairing">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Primary Physician Linkage</h4>
              <p className="text-xs text-slate-500 mt-0.5">Assign attending consultant to admitted patients (Phase 4)</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Assignment Operations" subtitle="Inpatient and outpatient assignment logs">
        <div className="py-8 text-center text-xs text-slate-400">
          Bed assignments and patient-doctor linkage records will be managed in Phase 4.
        </div>
      </Card>
    </div>
  );
}

import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { Users, Search } from 'lucide-react';

export default function DoctorPatientsPage() {
  return (
    <div>
      <PageHeader
        title="Assigned Patients Directory"
        subtitle="Review longitudinal patient charts, allergy profiles, and prior visit histories"
      />

      <Card title="Patient Registry Access" subtitle="Consultation caseload">
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 border border-purple-100">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Doctor Patient Directory (Phase 4)</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Doctors can only view records of patients assigned to them or holding active consultation appointments. Strict resource-level authorization will be enforced.
          </p>
        </div>
      </Card>
    </div>
  );
}

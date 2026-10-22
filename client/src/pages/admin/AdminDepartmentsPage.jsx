import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { Building2, Plus } from 'lucide-react';

export default function AdminDepartmentsPage() {
  const sampleDepartments = [
    { name: 'Cardiology', code: 'CARD', doctors: 4, status: 'Active' },
    { name: 'Orthopedics', code: 'ORTH', doctors: 3, status: 'Active' },
    { name: 'Pediatrics', code: 'PEDI', doctors: 3, status: 'Active' },
    { name: 'Neurology', code: 'NEUR', doctors: 2, status: 'Active' },
    { name: 'General Medicine', code: 'GMED', doctors: 5, status: 'Active' },
  ];

  return (
    <div>
      <PageHeader
        title="Department Management"
        subtitle="Configure hospital specialty divisions, unit codes, and head of department assignments"
        action={
          <Button icon={Plus} variant="primary" disabled>
            Add Department (Phase 3)
          </Button>
        }
      />

      <Card title="Active Clinical Divisions" subtitle="Sample department taxonomy">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleDepartments.map((dept, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {dept.code}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {dept.status}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-800">{dept.name}</h4>
              <p className="text-xs text-slate-500 mt-1">{dept.doctors} Assigned Physicians (Sample)</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

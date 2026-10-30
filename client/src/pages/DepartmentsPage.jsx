import React from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { Building2, Plus, Layers, Info } from 'lucide-react';

export default function DepartmentsPage() {
  return (
    <div>
      <PageHeader
        title="Hospital Departments"
        subtitle="Manage clinical units, codes, and department resource allocations"
        action={
          <Button icon={Plus} disabled>
            Add Department
          </Button>
        }
      />

      <div className="mb-6 p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-blue-900">Hospital Department Management</p>
          <p className="text-blue-700/90 text-xs mt-0.5">
            This module manages hospital departments (Cardiology, Orthopedics, Pediatrics, Neurology, etc.), department codes, status toggles, and clinician association.
          </p>
        </div>
      </div>

      <Card title="Active Departments" subtitle="Specialty units and clinical divisions">
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 border border-blue-100">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Department Directory</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Department CRUD APIs and hospital unit directories are synchronized with admin operations.
          </p>
          <div className="mt-6">
            <Button variant="outline" size="sm" icon={Layers} disabled>
              View Specialty Taxonomy
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

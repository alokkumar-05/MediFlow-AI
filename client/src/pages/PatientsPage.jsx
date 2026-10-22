import React from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { Users, UserPlus, Search, Info } from 'lucide-react';

export default function PatientsPage() {
  return (
    <div>
      <PageHeader
        title="Patient Directory & EMR"
        subtitle="Manage master patient records, allergy histories, and electronic medical records"
        action={
          <Button icon={UserPlus} disabled>
            Register Patient (Phase 2)
          </Button>
        }
      />

      <div className="mb-6 p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-blue-900">Upcoming EMR Implementation (Phase 4)</p>
          <p className="text-blue-700/90 text-xs mt-0.5">
            This module will maintain master demographic profiles, emergency contacts, known allergies, chronic conditions, prescriptions, and Cloudinary-backed diagnostic report attachments.
          </p>
        </div>
      </div>

      <Card title="Patient Registry" subtitle="Electronic Health Record database">
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 border border-blue-100">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Patient Database Offline in Phase 1</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Patient demographic search, role-protected medical charts, and prescription logs will be enabled after JWT authentication is introduced in Phase 2.
          </p>
          <div className="mt-6">
            <Button variant="outline" size="sm" icon={Search} disabled>
              Search by Medical Record Number (MRN)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

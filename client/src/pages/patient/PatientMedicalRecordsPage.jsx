import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { FileText, Upload, ShieldCheck } from 'lucide-react';

export default function PatientMedicalRecordsPage() {
  return (
    <div>
      <PageHeader
        title="My Medical Records & Prescriptions"
        subtitle="Access your consultation records, physician prescriptions, and diagnostic lab reports"
        action={
          <Button icon={Upload} variant="outline" disabled>
            Upload Report (Phase 4)
          </Button>
        }
      />

      <div className="mb-6 p-4 rounded-xl bg-blue-50/70 border border-blue-200/70 flex items-start gap-3 text-xs text-blue-800">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900">Privacy & Data Isolation</p>
          <p className="mt-0.5">
            Your electronic medical records are strictly isolated. Only you and your attending physicians have authorization to inspect your clinical records and attached lab documents.
          </p>
        </div>
      </div>

      <Card title="Health Records Repository" subtitle="Consultation histories and lab files">
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Medical Records Engine (Phase 4)</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Prescriptions issued by attending doctors, discharge summaries, and Cloudinary-stored lab test PDFs will appear here once Phase 4 is implemented.
          </p>
        </div>
      </Card>
    </div>
  );
}

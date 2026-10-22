import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { FileText, Plus, ShieldCheck } from 'lucide-react';

export default function DoctorMedicalRecordsPage() {
  return (
    <div>
      <PageHeader
        title="Electronic Medical Records (EMR)"
        subtitle="Write clinical consultation notes, generate prescriptions, and review diagnostic lab reports"
        action={
          <Button icon={Plus} variant="primary" disabled>
            New Prescription (Phase 4)
          </Button>
        }
      />

      <div className="mb-6 p-4 rounded-xl bg-blue-50/70 border border-blue-200/70 flex items-start gap-3 text-xs text-blue-800">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900">Clinician Review Requirement</p>
          <p className="mt-0.5">
            Diagnostic reports uploaded to Cloudinary will feature a side-by-side verification screen where physicians must review and approve AI extractions before committing to EMR.
          </p>
        </div>
      </div>

      <Card title="Clinical Records Registry" subtitle="Consultation chart history">
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">EMR Writer Standby (Phase 4)</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Prescription rows (medicine, dosage, frequency, duration), clinical notes, and ICD diagnostic tags will be implemented in Phase 4.
          </p>
        </div>
      </Card>
    </div>
  );
}
